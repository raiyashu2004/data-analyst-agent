import pandas as pd
import numpy as np
import json
from sandbox.executor import CodeExecutor

TOOLS = [
    {
        "name": "inspect_dataset",
        "description": "Get a full overview of the dataset: shape, column names, dtypes, null counts, and a sample of rows. Always call this first.",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_column_stats",
        "description": "Get detailed statistics for one or more columns.",
        "input_schema": {
            "type": "object",
            "properties": {
                "columns": {"type": "array", "items": {"type": "string"}, "description": "Column names to analyze"}
            },
            "required": ["columns"]
        }
    },
    {
        "name": "run_analysis",
        "description": "Execute Python code (pandas/numpy/matplotlib) against the dataset. Use `df` as the dataframe. Use `print()` to output results. Use `plt` for charts.",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Python code to execute using df, pd, np, plt."},
                "description": {"type": "string", "description": "One-sentence description of what this code does"}
            },
            "required": ["code", "description"]
        }
    },
    {
        "name": "detect_anomalies",
        "description": "Detect outliers in a numeric column using IQR method.",
        "input_schema": {
            "type": "object",
            "properties": {
                "column": {"type": "string", "description": "Numeric column to check for anomalies"}
            },
            "required": ["column"]
        }
    },
    {
        "name": "correlate_columns",
        "description": "Calculate pairwise correlations between numeric columns.",
        "input_schema": {
            "type": "object",
            "properties": {
                "columns": {"type": "array", "items": {"type": "string"}, "description": "Columns to correlate. Leave empty for all numeric."}
            },
            "required": []
        }
    },
    {
        "name": "generate_report",
        "description": "Generate the final analysis report. Call this when you have gathered enough insights.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "summary": {"type": "string"},
                "key_findings": {"type": "array", "items": {"type": "string"}},
                "recommendations": {"type": "array", "items": {"type": "string"}},
                "conclusion": {"type": "string"}
            },
            "required": ["title", "summary", "key_findings", "recommendations", "conclusion"]
        }
    }
]

TOOLS_OPENAI = [
    {"type": "function", "function": {"name": t["name"], "description": t["description"], "parameters": t["input_schema"]}}
    for t in TOOLS
]


class ToolRunner:
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.executor = CodeExecutor(df)
        self.charts = []

    def run(self, name: str, args: dict) -> dict:
        fn = getattr(self, f"_tool_{name}", None)
        if not fn:
            return {"error": f"Unknown tool: {name}"}
        try:
            return fn(**args)
        except Exception as e:
            return {"error": str(e)}

    def _tool_inspect_dataset(self) -> dict:
        df = self.df
        cols = []
        for col in df.columns:
            null_count = int(df[col].isnull().sum())
            info = {"name": col, "dtype": str(df[col].dtype), "null_count": null_count, "null_pct": round(null_count / len(df) * 100, 1)}
            if pd.api.types.is_numeric_dtype(df[col]):
                info["min"] = _safe(df[col].min())
                info["max"] = _safe(df[col].max())
                info["mean"] = _safe(df[col].mean())
            else:
                info["unique_count"] = int(df[col].nunique())
                info["top_values"] = {str(k): int(v) for k, v in df[col].value_counts().head(5).items()}
            cols.append(info)
        return {
            "shape": {"rows": int(df.shape[0]), "columns": int(df.shape[1])},
            "columns": cols,
            "sample": df.head(3).fillna("").to_dict(orient='records')
        }

    def _tool_get_column_stats(self, columns: list) -> dict:
        df = self.df
        stats = {}
        for col in columns:
            if col not in df.columns:
                stats[col] = {"error": "Column not found"}
                continue
            s = df[col]
            if not pd.api.types.is_numeric_dtype(s):
                top = s.value_counts().head(10)
                stats[col] = {"dtype": "categorical", "unique": int(s.nunique()), "nulls": int(s.isnull().sum()), "top_10": {str(k): int(v) for k, v in top.items()}}
            else:
                desc = s.describe()
                stats[col] = {
                    "dtype": str(s.dtype),
                    "count": int(desc.get("count", 0)),
                    "mean": round(float(desc.get("mean", 0)), 4),
                    "std": round(float(desc.get("std", 0)), 4),
                    "min": round(float(desc.get("min", 0)), 4),
                    "25%": round(float(desc.get("25%", 0)), 4),
                    "median": round(float(desc.get("50%", 0)), 4),
                    "75%": round(float(desc.get("75%", 0)), 4),
                    "max": round(float(desc.get("max", 0)), 4),
                    "nulls": int(s.isnull().sum()),
                    "unique": int(s.nunique())
                }
        return stats

    def _tool_run_analysis(self, code: str, description: str) -> dict:
        result = self.executor.run(code)
        if result["charts"]:
            self.charts.extend(result["charts"])
        return {"description": description, "output": result["output"], "error": result["error"], "charts_generated": len(result["charts"])}

    def _tool_detect_anomalies(self, column: str) -> dict:
        df = self.df
        if column not in df.columns:
            return {"error": f"Column '{column}' not found"}
        s = df[column].dropna()
        if not pd.api.types.is_numeric_dtype(s):
            return {"error": "Column must be numeric"}
        Q1, Q3 = s.quantile(0.25), s.quantile(0.75)
        IQR = Q3 - Q1
        lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
        outliers = df[(df[column] < lower) | (df[column] > upper)]
        return {
            "column": column,
            "iqr_bounds": {"lower": round(float(lower), 4), "upper": round(float(upper), 4)},
            "outlier_count": int(len(outliers)),
            "outlier_pct": round(len(outliers) / len(df) * 100, 2),
            "extreme_values": sorted([round(float(v), 4) for v in outliers[column].tolist()])[:10]
        }

    def _tool_correlate_columns(self, columns: list = None) -> dict:
        df = self.df
        numeric = df.select_dtypes(include=[np.number])
        if columns:
            numeric = numeric[[c for c in columns if c in numeric.columns]]
        if numeric.shape[1] < 2:
            return {"error": "Need at least 2 numeric columns"}
        corr = numeric.corr().round(3)
        pairs = []
        cols = list(corr.columns)
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                pairs.append({"col1": cols[i], "col2": cols[j], "correlation": float(corr.iloc[i, j])})
        pairs.sort(key=lambda x: abs(x["correlation"]), reverse=True)
        return {"matrix": corr.to_dict(), "strongest_pairs": pairs[:10]}

    def _tool_generate_report(self, title, summary, key_findings, recommendations, conclusion) -> dict:
        return {"type": "final_report", "title": title, "summary": summary, "key_findings": key_findings, "recommendations": recommendations, "conclusion": conclusion}


def _safe(v):
    try:
        if pd.isna(v): return None
        return round(float(v), 4)
    except:
        return str(v)
