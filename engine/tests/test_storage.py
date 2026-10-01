from storage import StorageManager
from storage import TempStorage


manifest = {

    "exports": [

        {

            "path": "output/files/Gunung Buthak-clean.gpx"

        },

        {

            "path": "output/viewer/Gunung Buthak.json"

        }

    ]

}

storage = StorageManager()

storage.register(

    TempStorage()

)

print(

    storage.save(

        manifest

    )

)

print(

    storage.cleanup()

)