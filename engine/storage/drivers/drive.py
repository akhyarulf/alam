from pathlib import Path

from storage.base import BaseStorage
from storage.clients.drive import DriveClient

from config import (
    GOOGLE_CREDENTIALS_FILE,
    GOOGLE_DRIVE_FOLDER_ID,
    DRIVE_SUFFIX
)


class DriveStorage(BaseStorage):
    """
    Google Drive Storage Driver.

    Driver ini bertugas menerima manifest,
    kemudian meneruskan upload ke DriveClient.
    """

    @property
    def name(self):
        return "drive"

    def __init__(self):

        self.client = DriveClient(

            credentials_file=GOOGLE_CREDENTIALS_FILE,

            folder_id=GOOGLE_DRIVE_FOLDER_ID

        )

    # ======================================
    # UPLOAD
    # ======================================

    def upload(self, manifest):

        results = []

        validation = self.client.validate()

        if not validation["status"]:

            for item in manifest["exports"]:

                results.append({

                    "destination": "drive",

                    "route_id": item["route_id"],
                    
                    "file": item["filename"],

                    "folder": item["folder"],

                    "status": "failed",

                    "id": None,

                    "url": None,

                    "download_url": None,

                    "uploaded_at": None,

                    "error": validation["error"]

                })

            return results

        for item in manifest["exports"]:

            ext = Path(item["filename"]).suffix

            route_id = item.get("route_id", "")

            # contoh: butak-via-panderman-nyasarnyaman.gpx
            remote_name = f"{route_id}-{DRIVE_SUFFIX}{ext}" if route_id else item["filename"]

            upload = self.client.upload_file(

                local_file=item["path"],

                remote_name=remote_name

            )

            results.append({

                "destination": "drive",

                "file": item["filename"],

                "folder": item["folder"],

                "status": upload["status"],

                "id": upload.get("id"),

                "url": upload.get("url"),

                "download_url": upload.get("download_url"),

                "uploaded_at": upload.get("uploaded_at"),

                "error": upload.get("error")

            })

        return results

    # ======================================
    # DOWNLOAD
    # ======================================

    def download(self, file_id):

        return self.client.get_file(

            file_id

        )

    # ======================================
    # DELETE
    # ======================================

    def delete(self, file_id):

        return self.client.delete_file(

            file_id

        )

    # ======================================
    # EXISTS
    # ======================================

    def exists(self, file_id):

        return self.client.file_exists(

            file_id

        )