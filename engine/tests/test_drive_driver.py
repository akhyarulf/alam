from pprint import pprint

from pipeline import process_track

from storage.manager import StorageManager
from storage.drivers.drive import DriveStorage


def main():

    # ======================================
    # BUILD PIPELINE
    # ======================================

    hasil = process_track(

        export=True,

        verbose=False

    )

    # ======================================
    # STORAGE MANAGER
    # ======================================

    manager = StorageManager()

    manager.register(

        DriveStorage()

    )

    # ======================================
    # UPLOAD
    # ======================================

    result = manager.upload(

        hasil["manifest"]

    )

    print()

    print("=" * 60)

    print("GOOGLE DRIVE RESULT")

    print("=" * 60)

    pprint(result)

    print()

    print("=" * 60)

    print("UPDATED MANIFEST")

    print("=" * 60)

    pprint(result["manifest"])


if __name__ == "__main__":

    main()