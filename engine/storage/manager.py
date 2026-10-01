from typing import List

from .base import BaseStorage


class StorageManager:
    """
    Mengatur seluruh storage driver.

    Driver menerima manifest,
    lalu mengembalikan hasil upload.

    StorageManager menggabungkan
    hasil upload kembali ke manifest.
    """

    def __init__(self):

        self.drivers: List[BaseStorage] = []


    # ======================================
    # REGISTER
    # ======================================

    def register(
        self,
        driver: BaseStorage
    ):

        self.drivers.append(driver)


    # ======================================
    # GET DRIVER
    # ======================================

    def get_driver(
        self,
        name
    ):

        for driver in self.drivers:

            if driver.name == name:

                return driver

        return None


    # ======================================
    # LIST
    # ======================================

    def list_drivers(self):

        return [

            driver.name

            for driver in self.drivers

        ]


    # ======================================
    # UPLOAD
    # ======================================

    def upload(
        self,
        manifest
    ):

        results = []

        summary = {

            "uploaded": 0,

            "success": 0,

            "failed": 0

        }


        for driver in self.drivers:


            exports = [

                item

                for item in manifest["exports"]

                if item.get("destination") == driver.name

            ]


            if not exports:

                continue


            driver_manifest = {

                **manifest,

                "exports": exports

            }


            # ==================================
            # SAFE DRIVER EXECUTION
            # ==================================

            try:

                driver_result = driver.upload(

                    driver_manifest

                )


            except Exception as e:


                driver_result = []


                for item in exports:

                    driver_result.append({

                        "destination": driver.name,

                        "file": item["filename"],

                        "folder": item.get("folder"),

                        "status": "failed",

                        "id": None,

                        "url": None,

                        "download_url": None,

                        "error": str(e)

                    })


            results.append({

                "driver": driver.name,

                "result": driver_result

            })


            # ==================================
            # UPDATE MANIFEST
            # ==================================

            for export in manifest["exports"]:


                for uploaded in driver_result:


                    if (

                        export["filename"]

                        == uploaded.get("file")

                    ):


                        export.update(

                            uploaded

                        )


                        summary["uploaded"] += 1


                        if uploaded.get("status") == "success":

                            summary["success"] += 1

                        else:

                            summary["failed"] += 1



        return {

            "drivers": results,

            "summary": summary,

            "manifest": manifest

        }