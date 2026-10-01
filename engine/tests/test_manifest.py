import json

from pipeline import process_track


hasil = process_track(
    export=True,
    verbose=False
)

print(

    json.dumps(

        hasil["manifest"],

        indent=4,

        ensure_ascii=False

    )

)