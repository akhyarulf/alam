from pprint import pprint

from pipeline import process_track

from storage.manager import StorageManager
from storage.drivers import (
    LocalStorage,
    GithubStorage
)

hasil = process_track(
    export=True,
    verbose=False
)

manager = StorageManager()

manager.register(
    LocalStorage()
)

manager.register(
    GithubStorage()
)

result = manager.upload(
    hasil["manifest"]
)

print()

pprint(result)
