"""
Console Report
"""


def print_summary(
    hasil,
    stats,
    removed_invalid,
    removed_duplicate,
    fixed_spike
):

    print()

    print("=" * 50)

    print("ALAM ENGINE SUMMARY")

    print("=" * 50)

    print()

    print("Cleaner")

    print("----------------")

    print(f"Invalid Removed : {removed_invalid}")

    print(f"Duplicate Removed : {removed_duplicate}")

    print(f"Elevation Fixed : {fixed_spike}")

    print()

    print("Statistics")

    print("----------------")

    for key, value in stats.items():

        print(f"{key} : {value}")

    print()

    print("Waypoints")

    print("----------------")

    for wp in hasil["waypoints"]:

        print(

            wp["name"],

            f'({wp["ele"]} mdpl)'

        )

    print()

    print("=" * 50)