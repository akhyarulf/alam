import base64
from pathlib import Path

import requests


class GithubClient:
    """
    GitHub REST API Client.

    Menangani komunikasi dengan
    GitHub Contents API.
    """

    def __init__(
        self,
        owner,
        repository,
        token,
        branch="main"
    ):

        self.owner = owner
        self.repository = repository
        self.token = token
        self.branch = branch

        self.api = (
            "https://api.github.com/repos/"
            f"{owner}/{repository}/contents"
        )

        self.repo_api = (
            "https://api.github.com/repos/"
            f"{owner}/{repository}"
        )

        self.headers = {

            "Authorization": f"Bearer {token}",

            "Accept": "application/vnd.github+json"

        }

    # ==========================================
    # INTERNAL
    # ==========================================

    def _url(self, path):

        return f"{self.api}/{path}"

    # ==========================================
    # VALIDATE
    # ==========================================

    def validate(self):

        if not self.token:

            return {

                "status": False,

                "error": "GitHub token belum dikonfigurasi."

            }

        response = requests.get(

            self.repo_api,

            headers=self.headers

        )

        if response.status_code == 401:

            return {

                "status": False,

                "error": "GitHub token tidak valid."

            }

        if response.status_code == 404:

            return {

                "status": False,

                "error": (
                    f"Repository "
                    f"{self.owner}/{self.repository} "
                    "tidak ditemukan."
                )

            }

        if response.status_code != 200:

            return {

                "status": False,

                "error": (
                    f"Gagal mengakses repository "
                    f"(HTTP {response.status_code})"
                )

            }

        response = requests.get(

            f"{self.repo_api}/branches/{self.branch}",

            headers=self.headers

        )

        if response.status_code == 404:

            return {

                "status": False,

                "error": (
                    f"Branch '{self.branch}' "
                    "tidak ditemukan."
                )

            }

        if response.status_code != 200:

            return {

                "status": False,

                "error": (
                    f"Gagal mengakses branch "
                    f"(HTTP {response.status_code})"
                )

            }

        return {

            "status": True,

            "error": None

        }

    # ==========================================
    # FILE EXISTS
    # ==========================================

    def file_exists(self, path):

        response = requests.get(

            self._url(path),

            headers=self.headers,

            params={

                "ref": self.branch

            }

        )

        return response.status_code == 200

    # ==========================================
    # GET SHA
    # ==========================================

    def get_sha(self, path):

        response = requests.get(

            self._url(path),

            headers=self.headers,

            params={

                "ref": self.branch

            }

        )

        if response.status_code != 200:

            return None

        return response.json()["sha"]

    # ==========================================
    # UPLOAD FILE
    # ==========================================

    def upload_file(

        self,

        local_file,

        remote_file,

        message="Upload from Alam Engine"

    ):

        validation = self.validate()

        if not validation["status"]:

            return {

                "status": "failed",

                "url": None,

                "sha": None,

                "error": validation["error"]

            }

        local_file = Path(local_file)

        if not local_file.exists():

            return {

                "status": "missing",

                "url": None,

                "sha": None,

                "error": "File lokal tidak ditemukan."

            }

        with open(

            local_file,

            "rb"

        ) as f:

            content = base64.b64encode(

                f.read()

            ).decode()

        payload = {

            "message": message,

            "content": content,

            "branch": self.branch

        }

        sha = self.get_sha(remote_file)

        if sha:

            payload["sha"] = sha

        response = requests.put(

            self._url(remote_file),

            headers=self.headers,

            json=payload

        )

        if response.status_code not in (200, 201):

            return {

                "status": "failed",

                "url": None,

                "sha": None,

                "error": response.text

            }

        data = response.json()

        return {

            "status": "success",

            "url": data["content"]["download_url"],

            "sha": data["content"]["sha"],

            "error": None

        }

    # ==========================================
    # DELETE FILE
    # ==========================================

    def delete_file(

        self,

        remote_file,

        message="Delete from Alam Engine"

    ):

        sha = self.get_sha(remote_file)

        if not sha:

            return False

        payload = {

            "message": message,

            "sha": sha,

            "branch": self.branch

        }

        response = requests.delete(

            self._url(remote_file),

            headers=self.headers,

            json=payload

        )

        return response.status_code == 200

    # ==========================================
    # DOWNLOAD INFO
    # ==========================================

    def get_file(self, remote_file):

        response = requests.get(

            self._url(remote_file),

            headers=self.headers,

            params={

                "ref": self.branch

            }

        )

        if response.status_code != 200:

            return None

        return response.json()