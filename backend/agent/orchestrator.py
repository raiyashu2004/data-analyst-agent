import json
import httpx
import os
import pandas as pd
from typing import AsyncGenerator
from agent.tools import TOOLS, TOOLS_OPENAI, ToolRunner

MAX_STEPS = 12

SYSTEM_PROMPT = """You are an expert autonomous data analyst. You have been given a dataset and a question to answer.

Your job is to:
1. ALWAYS start by calling inspect_dataset to understand the data
2. Plan your analysis based on the question
3. Use the available tools to explore, query, and visualize the data
4. Run multiple analyses to gather strong evidence
5. When you have enough insight, call generate_report with your findings

Rules:
- Be thorough - run at least 3-4 analyses before reporting
- If code produces an error, fix and retry with corrected code
- Generate at least one chart using matplotlib (plt) when relevant
- Base ALL findings on actual data - never fabricate numbers
- For charts: fig.patch.set_facecolor('#0d1420'); ax.set_facecolor('#0d1420'); use '#00f0c8' as primary color, white tick labels
- Always use print() to output key statistics alongside charts
- Example: print(df.groupby('region')['revenue'].mean().to_string())
"""


class AgentOrchestrator:
    def __init__(self, df: pd.DataFrame, question: str, provider: str = "gemini"):
        self.df = df
        self.question = question
        self.provider = provider
        self.tool_runner = ToolRunner(df)
        self.messages = []
        self.final_report = None

    async def run_stream(self) -> AsyncGenerator[dict, None]:
        dataset_hint = f"Dataset: {self.df.shape[0]} rows x {self.df.shape[1]} columns. Columns: {list(self.df.columns)}"
        self.messages = [{"role": "user", "content": f"{dataset_hint}\n\nQuestion: {self.question}"}]

        yield {"type": "start", "message": "🧠 Agent initializing analysis..."}

        step_count = 0
        while step_count < MAX_STEPS:
            step_count += 1
            yield {"type": "thinking", "message": f"🔍 Reasoning... (step {step_count})"}

            try:
                response = await self._call_llm()
            except Exception as e:
                yield {"type": "error", "message": f"LLM error: {str(e)}"}
                return

            tool_calls, text = self._parse_response(response)

            if text:
                yield {"type": "thought", "message": text[:300]}

            if not tool_calls:
                yield {"type": "done", "message": "✅ Analysis complete"}
                break

            for tc in tool_calls:
                tool_name = tc["name"]
                tool_args = tc["args"]

                yield {"type": "tool_start", "tool": tool_name, "message": self._step_label(tool_name, tool_args)}

                result = self.tool_runner.run(tool_name, tool_args)

                if tool_name == "run_analysis" and self.tool_runner.charts:
                    new_charts = self.tool_runner.charts[-(result.get("charts_generated", 0)):]
                    for chart in new_charts:
                        yield {"type": "chart", "data": chart}

                yield {"type": "tool_result", "tool": tool_name, "message": self._summarize_result(tool_name, result), "data": result}

                if tool_name == "generate_report":
                    self.final_report = result
                    yield {"type": "report", "report": result, "charts": self.tool_runner.charts}
                    yield {"type": "done", "message": "✅ Analysis complete!"}
                    return

                self._add_tool_result(tc, result)

        if self.tool_runner.charts:
            forced_report = {
                "type": "final_report",
                "title": "Data Analysis Report",
                "summary": "The agent completed multiple analyses and generated visualizations. See findings below.",
                "key_findings": [
                    "Multiple data visualizations were generated during analysis.",
                    "Review the agent trace on the left for detailed step-by-step findings.",
                    "Charts show key patterns found in the dataset."
                ],
                "recommendations": [
                    "Use the follow-up chat to ask specific questions about the charts.",
                    "Try a more specific question for a more focused analysis."
                ],
                "conclusion": "Analysis completed. Use the follow-up chat feature to explore specific insights."
            }
            yield {"type": "report", "report": forced_report, "charts": self.tool_runner.charts}
            yield {"type": "done", "message": "✅ Analysis complete!"}
        else:
            yield {"type": "done", "message": "✅ Max steps reached"}

    # ── LLM Calls ──────────────────────────────────────────────────────────────

    async def _call_llm(self) -> dict:
        if self.provider == "gemini":
            return await self._call_gemini()
        elif self.provider == "claude":
            return await self._call_claude()
        else:
            return await self._call_openai()

    async def _call_gemini(self) -> dict:
        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in .env file")

        from google import genai
        from google.genai import types

        client = genai.Client(api_key=api_key)

        tool_declarations = []
        for tool in TOOLS:
            props = {}
            for pname, pdef in tool["input_schema"].get("properties", {}).items():
                ptype = pdef.get("type", "string")
                type_map = {"string": "STRING", "integer": "INTEGER", "number": "NUMBER", "boolean": "BOOLEAN", "array": "ARRAY", "object": "OBJECT"}
                mapped_type = type_map.get(ptype, "STRING")
                if mapped_type == "ARRAY":
                    props[pname] = types.Schema(type="ARRAY", description=pdef.get("description", ""), items=types.Schema(type="STRING"))
                else:
                    props[pname] = types.Schema(type=mapped_type, description=pdef.get("description", ""))
            tool_declarations.append(types.FunctionDeclaration(
                name=tool["name"],
                description=tool["description"],
                parameters=types.Schema(type="OBJECT", properties=props, required=tool["input_schema"].get("required", []))
            ))

        gemini_tool = types.Tool(function_declarations=tool_declarations)

        contents = []
        for msg in self.messages:
            role = "user" if msg["role"] in ["user", "tool"] else "model"
            content = msg.get("content", "")
            if isinstance(content, list):
                text = " ".join(c.get("content", "") if isinstance(c, dict) else str(c) for c in content)
            else:
                text = str(content)
            if text.strip():
                contents.append(types.Content(role=role, parts=[types.Part(text=text)]))

        config = types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT, tools=[gemini_tool], temperature=0.2)
        response = client.models.generate_content(model="models/gemini-3.1-flash-lite", contents=contents, config=config)
        return {"provider": "gemini", "raw": response}

    async def _call_claude(self) -> dict:
        api_key = os.environ.get("ANTHROPIC_API_KEY", "")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not set")
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={"x-api-key": api_key, "anthropic-version": "2023-06-01", "content-type": "application/json"},
                json={"model": "claude-haiku-4-5-20251001", "max_tokens": 2000, "system": SYSTEM_PROMPT, "tools": TOOLS, "messages": self.messages}
            )
            data = resp.json()
            if "error" in data:
                raise ValueError(data["error"].get("message", "Claude API error"))
            return {"provider": "claude", "raw": data}

    async def _call_openai(self) -> dict:
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set")
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "content-type": "application/json"},
                json={"model": "gpt-4o", "max_tokens": 2000, "tools": TOOLS_OPENAI, "tool_choice": "auto", "messages": [{"role": "system", "content": SYSTEM_PROMPT}] + self.messages}
            )
            data = resp.json()
            if resp.status_code != 200:
                raise ValueError(data.get("error", {}).get("message", f"OpenAI HTTP {resp.status_code}"))
            return {"provider": "openai", "raw": data}

    # ── Response Parsing ───────────────────────────────────────────────────────

    def _parse_response(self, response: dict):
        provider = response["provider"]
        raw = response["raw"]
        tool_calls = []
        text = ""

        if provider == "gemini":
            candidate = raw.candidates[0]
            for part in candidate.content.parts:
                if part.function_call and part.function_call.name:
                    fc = part.function_call
                    args = {}
                    for k, v in fc.args.items():
                        args[k] = list(v) if hasattr(v, '__iter__') and not isinstance(v, str) else v
                    tool_calls.append({"id": fc.name, "name": fc.name, "args": args})
                elif hasattr(part, "text") and part.text:
                    text = part.text
            self.messages.append({"role": "assistant", "content": text or "(processing)"})

        elif provider == "claude":
            content = raw.get("content", [])
            self.messages.append({"role": "assistant", "content": content})
            for block in content:
                if block.get("type") == "text":
                    text = block.get("text", "")
                elif block.get("type") == "tool_use":
                    tool_calls.append({"id": block.get("id"), "name": block.get("name"), "args": block.get("input", {})})

        elif provider == "openai":
            msg = raw["choices"][0]["message"]
            self.messages.append(msg)
            text = msg.get("content") or ""
            for tc in (msg.get("tool_calls") or []):
                try:
                    args = json.loads(tc["function"]["arguments"])
                except Exception:
                    args = {}
                tool_calls.append({"id": tc["id"], "name": tc["function"]["name"], "args": args})

        return tool_calls, text

    def _add_tool_result(self, tc: dict, result: dict):
        result_str = json.dumps(result, default=str)[:3000]
        if self.provider == "claude":
            self.messages.append({"role": "user", "content": [{"type": "tool_result", "tool_use_id": tc["id"], "content": result_str}]})
        elif self.provider == "gemini":
            self.messages.append({"role": "user", "content": f"Tool '{tc['name']}' result: {result_str}"})
        else:
            self.messages.append({"role": "tool", "tool_call_id": tc["id"], "content": result_str})

    def _step_label(self, tool_name: str, args: dict) -> str:
        labels = {
            "inspect_dataset": "🔎 Inspecting dataset structure...",
            "get_column_stats": f"📊 Analyzing columns: {', '.join(args.get('columns', []))}",
            "run_analysis": f"🧮 {args.get('description', 'Running analysis...')}",
            "detect_anomalies": f"🚨 Detecting anomalies in '{args.get('column', '')}'...",
            "correlate_columns": "🔗 Computing correlations...",
            "generate_report": "📝 Generating final report..."
        }
        return labels.get(tool_name, f"⚙️ Running {tool_name}...")

    def _summarize_result(self, tool_name: str, result: dict) -> str:
        if result.get("error"):
            return f"⚠️ Error: {result['error']}"
        if tool_name == "inspect_dataset":
            r = result.get("shape", {})
            return f"✅ Dataset: {r.get('rows', '?')} rows x {r.get('columns', '?')} columns"
        if tool_name == "run_analysis":
            out = result.get("output", "")
            charts = result.get("charts_generated", 0)
            return f"✅ {out[:120]}" + (f" | 📈 {charts} chart(s)" if charts else "")
        if tool_name == "detect_anomalies":
            return f"✅ Found {result.get('outlier_count', 0)} outliers ({result.get('outlier_pct', 0)}%)"
        if tool_name == "correlate_columns":
            pairs = result.get("strongest_pairs", [])
            if pairs:
                t = pairs[0]
                return f"✅ Strongest: {t['col1']} ↔ {t['col2']} = {t['correlation']}"
        if tool_name == "generate_report":
            return "✅ Report generated"
        return "✅ Done"
