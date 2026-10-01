"""
Alam Engine Custom Exceptions
"""


class AlamEngineError(Exception):
    """Base exception untuk semua error Alam Engine."""
    pass


class InvalidGPXError(AlamEngineError):
    """File GPX tidak valid."""
    pass


class EmptyTrackError(AlamEngineError):
    """Track tidak memiliki titik."""
    pass


class InvalidCoordinateError(AlamEngineError):
    """Koordinat tidak valid."""
    pass


class ExportError(AlamEngineError):
    """Gagal melakukan export."""
    pass