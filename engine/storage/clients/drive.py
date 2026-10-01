from pathlib import Path
from datetime import datetime

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

from google_auth_oauthlib.flow import InstalledAppFlow

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload


class DriveClient:
    """
    Google Drive Client.

    OAuth Desktop Version.

    Token akan otomatis dibuat
    pada login pertama.
    """

    SCOPES = [

        "https://www.googleapis.com/auth/drive"

    ]

    def __init__(

        self,

        credentials_file,

        folder_id=None,

        token_file="token.json"

    ):

        self.credentials_file = credentials_file

        self.folder_id = folder_id

        self.token_file = token_file

        self.credentials = None

        self.service = None

    # ======================================
    # CONNECT
    # ======================================

    def connect(self):

        if Path(

            self.token_file

        ).exists():

            self.credentials = Credentials.from_authorized_user_file(

                self.token_file,

                self.SCOPES

            )

        if (

            self.credentials

            and

            self.credentials.expired

            and

            self.credentials.refresh_token

        ):

            self.credentials.refresh(

                Request()

            )

            Path(

                self.token_file

            ).write_text(

                self.credentials.to_json(),

                encoding="utf-8"

            )

        if (

            self.credentials is None

            or

            not self.credentials.valid

        ):

            flow = InstalledAppFlow.from_client_secrets_file(

                self.credentials_file,

                self.SCOPES

            )

            self.credentials = flow.run_local_server(

                port=0

            )

            Path(

                self.token_file

            ).write_text(

                self.credentials.to_json(),

                encoding="utf-8"

            )

        self.service = build(

            "drive",

            "v3",

            credentials=self.credentials,

            cache_discovery=False

        )

    # ======================================
    # VALIDATE
    # ======================================

    def validate(self):

        try:

            if self.service is None:

                self.connect()

            about = self.service.about().get(

                fields="user"

            ).execute()

            return {

                "status": True,

                "user": about.get("user", {}),

                "error": None

            }

        except Exception as e:

            return {

                "status": False,

                "user": None,

                "error": str(e)

            }

    # ======================================
    # UPLOAD
    # ======================================
    
    def upload_file(

        self,

        local_file,

        remote_name=None

    ):

        validation = self.validate()

        if not validation["status"]:

            return {

                "status": "failed",

                "id": None,

                "url": None,

                "download_url": None,

                "uploaded_at": None,

                "error": validation["error"]

            }

        local_file = Path(local_file)

        if not local_file.exists():

            return {

                "status": "missing",

                "id": None,

                "url": None,

                "download_url": None,

                "uploaded_at": None,

                "error": "File tidak ditemukan."

            }

        metadata = {

            "name": remote_name or local_file.name

        }

        if self.folder_id:

            metadata["parents"] = [

                self.folder_id

            ]

        media = MediaFileUpload(

            filename=str(local_file),

            resumable=True

        )

        created = self.service.files().create(

            body=metadata,

            media_body=media,

            fields="id,name,webViewLink,webContentLink"

        ).execute()

        file_id = created["id"]

        try:

            self.service.permissions().create(

                fileId=file_id,

                body={

                    "type": "anyone",

                    "role": "reader"

                }

            ).execute()

        except Exception:

            pass

        info = self.service.files().get(

            fileId=file_id,

            fields="id,name,webViewLink,webContentLink"

        ).execute()

        return {

            "status": "success",

            "id": info["id"],

            "url": info.get(

                "webViewLink"

            ),

            "download_url": info.get(

                "webContentLink"

            ),

            "uploaded_at": datetime.utcnow().isoformat(),

            "error": None

        }

    # ======================================
    # DELETE
    # ======================================
    
    def delete_file(

        self,

        file_id

    ):

        validation = self.validate()

        if not validation["status"]:

            return False

        try:

            self.service.files().delete(

                fileId=file_id

            ).execute()

            return True

        except Exception:

            return False

    # ======================================
    # GET FILE
    # ======================================

    def get_file(

        self,

        file_id

    ):

        validation = self.validate()

        if not validation["status"]:

            return None

        try:

            return self.service.files().get(

                fileId=file_id,

                fields=(
                    "id,"
                    "name,"
                    "mimeType,"
                    "size,"
                    "webViewLink,"
                    "webContentLink,"
                    "createdTime,"
                    "modifiedTime,"
                    "parents"
                )

            ).execute()

        except Exception:

            return None

    # ======================================
    # EXISTS
    # ======================================

    def file_exists(

        self,

        file_id

    ):

        return self.get_file(

            file_id

        ) is not None

    # ======================================
    # USER
    # ======================================

    def get_user(self):

        validation = self.validate()

        if not validation["status"]:

            return None

        return self.service.about().get(

            fields="user"

        ).execute()

    # ======================================
    # FOLDER
    # ======================================

    def get_folder(self):

        validation = self.validate()

        if not validation["status"]:

            return None

        if not self.folder_id:

            return None

        return self.service.files().get(

            fileId=self.folder_id,

            fields="id,name"

        ).execute()