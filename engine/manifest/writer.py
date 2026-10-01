import json
from pathlib import Path


class ManifestWriter:
    """
    Manifest Writer

    Bertugas menyimpan dan membaca
    manifest.json.

    Builder membuat manifest.

    Writer menyimpan manifest.
    """

    def __init__(

        self,

        manifest

    ):

        self.manifest = manifest

    # ======================================
    # SAVE
    # ======================================

    def save(

        self,

        output_folder

    ):

        output_folder = Path(

            output_folder

        )

        output_folder.mkdir(

            parents=True,

            exist_ok=True

        )

        manifest_file = (

            output_folder /

            "manifest.json"

        )

        with open(

            manifest_file,

            "w",

            encoding="utf-8"

        ) as f:

            json.dump(

                self.manifest,

                f,

                indent=2,

                ensure_ascii=False

            )

        return str(

            manifest_file

        )

    # ======================================
    # LOAD
    # ======================================

    @staticmethod
    def load(

        manifest_file

    ):

        manifest_file = Path(

            manifest_file

        )

        if not manifest_file.exists():

            return None

        with open(

            manifest_file,

            "r",

            encoding="utf-8"

        ) as f:

            return json.load(

                f

            )

    # ======================================
    # EXISTS
    # ======================================

    @staticmethod
    def exists(

        manifest_file

    ):

        return Path(

            manifest_file

        ).exists()