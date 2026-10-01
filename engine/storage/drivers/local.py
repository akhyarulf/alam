from pathlib import Path
import shutil

from storage.base import BaseStorage


class LocalStorage(BaseStorage):
    """
    Driver Local Storage.

    Menyalin seluruh file export ke:

        workspace/storage/local/

    Digunakan untuk testing sebelum
    memakai GitHub atau Google Drive.
    """

    @property
    def name(self):
        return "local"

    def upload(self, manifest):

        results = []

        root = Path("workspace") / "storage" / "local"

        root.mkdir(
            parents=True,
            exist_ok=True
        )

        for item in manifest["exports"]:

            source = Path(item["path"])

            if not source.exists():

                results.append({

                    "file": item["filename"],
                    "folder": item["folder"],
                    "status": "missing",
                    "location": None

                })

                continue

            destination_folder = root / item["folder"]

            destination_folder.mkdir(
                parents=True,
                exist_ok=True
            )

            destination = destination_folder / item["filename"]

            shutil.copy2(
                source,
                destination
            )

            results.append({

                "file": item["filename"],
                "folder": item["folder"],
                "status": "success",
                "location": str(destination)

            })

        return results

    def download(self, source, destination):

        source = Path(source)
        destination = Path(destination)

        destination.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        shutil.copy2(
            source,
            destination
        )

        return str(destination)

    def delete(self, path):

        path = Path(path)

        if path.exists():

            path.unlink()

            return True

        return False

    def exists(self, path):

        return Path(path).exists()