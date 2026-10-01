from pathlib import Path
import shutil


class Workspace:
    """
    Mengelola workspace sementara.

    Struktur default:

    workspace/
        input/
        output/
        temp/
    """

    def __init__(self, root="workspace"):

        self.root = Path(root)

        self.input = self.root / "input"

        self.output = self.root / "output"

        self.temp = self.root / "temp"

    def create(self):

        self.input.mkdir(parents=True, exist_ok=True)

        self.output.mkdir(parents=True, exist_ok=True)

        self.temp.mkdir(parents=True, exist_ok=True)

    def clear_temp(self):

        if self.temp.exists():

            shutil.rmtree(self.temp)

        self.temp.mkdir(parents=True, exist_ok=True)

    def clear_output(self):

        if self.output.exists():

            shutil.rmtree(self.output)

        self.output.mkdir(parents=True, exist_ok=True)

    def reset(self):

        self.clear_temp()

        self.clear_output()

    def info(self):

        return {

            "root": str(self.root),

            "input": str(self.input),

            "output": str(self.output),

            "temp": str(self.temp)

        }