from pipeline import process_track

from storage.manager import StorageManager
from storage.drivers.github import GithubStorage


hasil = process_track(
    export=True,
    verbose=False
)

manager = StorageManager()

manager.register(
    GithubStorage()
)

result = manager.upload(
    hasil["manifest"]
)

print()

print(result)