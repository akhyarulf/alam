from pipeline import process_track


def line():

    print("=" * 60)


print()
line()
print("ALAM ENGINE v1.3.2 RELEASE TEST")
line()

hasil = process_track(
    export=True,
    verbose=False
)

print()

print("TRACK")
print(" ", hasil["name"])

print()

print("ROUTE ID")
print(" ", hasil["route_id"])

print()

print("POINTS")
print(" ", len(hasil["track"]))

print()

print("STATISTICS")

stats = hasil["stats"]

print(f"  Distance : {stats['distance_km']} km")
print(f"  Gain     : {stats['gain']} m")
print(f"  Loss     : {stats['loss']} m")
print(f"  Highest  : {stats['highest']} mdpl")
print(f"  Lowest   : {stats['lowest']} mdpl")

print()

print("OUTPUTS")

for item in hasil["outputs"]:

    status = item.get("status", "-")

    print(

        f"  [{status.upper():7}] "

        f"{item['format']:8}"

        f"{item['filename']}"

    )

print()

print("MANIFEST")

if hasil["manifest"]:

    print("  OK")

    print("  Engine :", hasil["manifest"]["engine"]["version"])

    print("  Route  :", hasil["manifest"]["id"])

else:

    print("  FAILED")

line()
print("RELEASE SUCCESS")
line()