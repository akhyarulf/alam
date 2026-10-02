from abc import ABC, abstractmethod


class BaseStorage(ABC):
    """
    Base class untuk semua storage driver.

    Semua driver (GitHub, Local, dll)
    wajib mengikuti interface ini.
    """

    @property
    @abstractmethod
    def name(self):
        """Nama driver."""
        pass

    @abstractmethod
    def upload(self, manifest):
        """
        Upload file berdasarkan manifest.
        """
        pass

    @abstractmethod
    def download(self, *args, **kwargs):
        """
        Download file dari storage.
        """
        pass

    @abstractmethod
    def delete(self, *args, **kwargs):
        """
        Hapus file dari storage.
        """
        pass

    @abstractmethod
    def exists(self, *args, **kwargs):
        """
        Cek apakah file ada.
        """
        pass