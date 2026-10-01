from pipeline import process_track


hasil = process_track(
    export=False,
    verbose=False
)

print()

print("TRACK")
print(hasil["name"])

print()

print("POINTS")
print(len(hasil["track"]))

print()

print("STATS")
print(hasil["stats"])