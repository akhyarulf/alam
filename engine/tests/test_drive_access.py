from storage.clients.drive import DriveClient
from config import *

client = DriveClient(
    GOOGLE_CREDENTIALS_FILE,
    GOOGLE_DRIVE_FOLDER_ID
)

client.connect()

print(
    client.service.about().get(
        fields="user,storageQuota"
    ).execute()
)