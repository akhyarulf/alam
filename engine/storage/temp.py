from pathlib import Path

from .base import BaseStorage


class TempStorage(BaseStorage):

    def __init__(self):

        self.saved_files = []

    def save(self, manifest):

        for item in manifest["exports"]:

            file = Path(item["path"])

            if file.exists():

                self.saved_files.append(file)

        return self.saved_files

    def cleanup(self):

        deleted = 0

        for file in self.saved_files:

            try:

                file.unlink()

                deleted += 1

            except Exception:

                pass

        self.saved_files.clear()

        return deleted