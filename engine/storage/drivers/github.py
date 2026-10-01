from datetime import datetime

from storage.base import BaseStorage
from storage.clients.github import GithubClient

from config import (
    GITHUB_OWNER,
    GITHUB_REPOSITORY,
    GITHUB_BRANCH,
    GITHUB_TOKEN
)


class GithubStorage(BaseStorage):

    @property
    def name(self):
        return "github"

    def __init__(self):

        self.client = GithubClient(

            owner=GITHUB_OWNER,

            repository=GITHUB_REPOSITORY,

            token=GITHUB_TOKEN,

            branch=GITHUB_BRANCH

        )

    # ======================================
    # UPLOAD
    # ======================================

    def upload(self, manifest):

        results = []

        for item in manifest["exports"]:

            route_id = item["route_id"]

            remote_path = (

                f'{item["folder"]}/'

                f'{route_id}/'

                f'{item["filename"]}'

            )

            upload = self.client.upload_file(

                local_file=item["path"],

                remote_file=remote_path,

                message=(
                    f"Update {route_id}/"
                    f"{item['filename']}"
                )

            )

            raw_url = upload.get("url")

            html_url = None

            if raw_url:

                html_url = (

                    f"https://github.com/"

                    f"{GITHUB_OWNER}/"

                    f"{GITHUB_REPOSITORY}/"

                    f"blob/{GITHUB_BRANCH}/"

                    f"{remote_path}"

                )

            results.append({

                "destination": "github",

                "route_id": route_id,

                "file": item["filename"],

                "folder": item["folder"],

                "status": upload.get("status"),

                "raw_url": raw_url,

                "html_url": html_url,

                "sha": upload.get("sha"),

                "commit": (
                    f"Update {route_id}/"
                    f"{item['filename']}"
                ),

                "uploaded_at": datetime.utcnow().isoformat(),

                "error": upload.get("error")

            })

        return results

    # ======================================
    # UPLOAD MANIFEST
    # ======================================

    def upload_manifest(
        self,
        local_file,
        route_id
    ):

        remote_file = (

            f"viewer/"

            f"{route_id}/"

            f"manifest.json"

        )

        return self.client.upload_file(

            local_file=local_file,

            remote_file=remote_file,

            message=f"Update {route_id}/manifest.json"

        )

    # ======================================
    # DOWNLOAD
    # ======================================

    def download(self, remote_file):

        return self.client.get_file(

            remote_file

        )

    # ======================================
    # DELETE
    # ======================================

    def delete(self, remote_file):

        return self.client.delete_file(

            remote_file

        )

    # ======================================
    # EXISTS
    # ======================================

    def exists(self, remote_file):

        return self.client.file_exists(

            remote_file

        )