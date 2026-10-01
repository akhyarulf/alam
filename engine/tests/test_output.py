from pipeline import process_track


hasil = process_track(
    export=True,
    verbose=False
)

print()

for output in hasil["outputs"]:

    print(output)