import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io, base64, traceback, contextlib, builtins

class CodeExecutor:
    def __init__(self, df: pd.DataFrame):
        self.df = df.copy()

    def run(self, code: str) -> dict:
        stdout_buf = io.StringIO()
        charts = []
        safe_globals = {
            "__builtins__": builtins,
            "pd": pd, "np": np, "plt": plt,
            "df": self.df.copy(),
        }
        try:
            with contextlib.redirect_stdout(stdout_buf):
                exec(code, safe_globals)  # nosec
            for fig_num in plt.get_fignums():
                fig = plt.figure(fig_num)
                buf = io.BytesIO()
                fig.savefig(buf, format='png', bbox_inches='tight', facecolor='#0d1420', dpi=130)
                buf.seek(0)
                charts.append(base64.b64encode(buf.read()).decode())
                plt.close(fig)
            output = stdout_buf.getvalue().strip()
            return {"output": output or "(analysis complete)", "error": None, "charts": charts}
        except Exception:
            plt.close('all')
            err = traceback.format_exc().split('\n')
            short = '\n'.join([l for l in err if l.strip()][-3:])
            return {"output": "", "error": short, "charts": []}
