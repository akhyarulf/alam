from outputs.manager import OutputManager

manager = OutputManager("Gunung Buthak")

manager.add("gpx", suffix="-clean")
manager.add("geojson")
manager.add("json", folder="viewer")
manager.add("kml", folder="files")

print("===== OUTPUT MANAGER =====")

for item in manager.get_outputs():
    print(item)