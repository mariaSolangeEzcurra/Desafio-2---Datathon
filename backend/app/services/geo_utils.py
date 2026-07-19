from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
import pandas as pd

RADIO_TOLERANCIA_METROS = 100.0
GAP_MAXIMO_VALIDO_MIN = 60
LAT_MIN, LAT_MAX = -18.0, -15.0
LON_MIN, LON_MAX = -73.0, -70.0
CODIGOS_VACIOS = ("0", "00", "0.0", "00.0", "")

def limpiar_coordenada(valor, tipo: str) -> float | None:
    if pd.isna(valor):
        return None
    val_str = str(valor).strip().replace(" ", "").replace(".", "")
    if "9999" in val_str or val_str == "" or val_str == "0":
        return None
    negativo = val_str.startswith("-")
    solo_digitos = "".join(c for c in val_str if c.isdigit())
    if not solo_digitos:
        return None
    try:
        entero = solo_digitos[:2]
        decimal = solo_digitos[2:]
        if not decimal:
            return None
        coordenada = float(f"{entero}.{decimal}")
        if negativo:
            coordenada = -coordenada
        if tipo == "lat" and not (LAT_MIN <= coordenada <= LAT_MAX):
            return None
        if tipo == "lon" and not (LON_MIN <= coordenada <= LON_MAX):
            return None
        return coordenada
    except ValueError:
        return None

def distancia_metros(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lon2 - lon1)
    a = sin(dphi / 2) ** 2 + cos(phi1) * cos(phi2) * sin(dlambda / 2) ** 2
    return 2 * R * atan2(sqrt(a), sqrt(1 - a))

def limpiar_fecha(valor) -> datetime:
    if pd.isna(valor):
        return datetime.now()
    val_str = str(valor).strip()
    try:
        return datetime.strptime(val_str, "%m/%d/%Y, %H:%M:%S")
    except ValueError:
        try:
            return datetime.fromisoformat(val_str)
        except ValueError:
            try:
                return pd.to_datetime(valor).to_pydatetime()
            except Exception:
                return datetime.now()