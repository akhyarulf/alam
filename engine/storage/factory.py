from storage.drivers.local import LocalStorage
from storage.drivers.github import GithubStorage


STORAGES = {
    "local": LocalStorage,
    "github": GithubStorage,
}


def get_storage(name="local"):

    storage = STORAGES.get(name.lower())

    if storage is None:
        raise ValueError(
            f"Storage '{name}' tidak ditemukan."
        )

    return storage()
