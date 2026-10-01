import zipfile
import tempfile

from exceptions import AlamEngineError
from parser.kml import parse_kml


def parse_kmz(file):

    with zipfile.ZipFile(file, "r") as z:

        kml_name = None
        for name in z.namelist():
            if name.lower().endswith(".kml"):
                kml_name = name
                break

        if not kml_name:
            raise AlamEngineError("KMZ tidak berisi file .kml.")

        with tempfile.TemporaryDirectory() as tmp:
            extracted = z.extract(kml_name, tmp)
            return parse_kml(extracted)
