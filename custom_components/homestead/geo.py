"""Map geometry helpers (no Home Assistant dependency).

Geometries are GeoJSON dicts with [longitude, latitude] coordinates.
"""

from __future__ import annotations

import math
from typing import Any

EARTH_RADIUS_M = 6378137

Geometry = dict[str, Any]


def validate_polygon(value: Any) -> Geometry:
    """Return a clean GeoJSON Polygon or raise ValueError."""
    if not isinstance(value, dict) or value.get("type") != "Polygon":
        raise ValueError("expected a GeoJSON Polygon")
    rings = value.get("coordinates")
    if not isinstance(rings, list) or not rings:
        raise ValueError("polygon without coordinates")
    clean = []
    for ring in rings:
        points = [_point(p) for p in ring]
        if len(points) < 3:
            raise ValueError("a polygon ring needs at least 3 points")
        if points[0] != points[-1]:
            points.append(points[0])
        clean.append(points)
    return {"type": "Polygon", "coordinates": clean}


def _point(value: Any) -> list[float]:
    if not isinstance(value, list | tuple) or len(value) < 2:
        raise ValueError("a point is [longitude, latitude]")
    lon, lat = float(value[0]), float(value[1])
    if not (-180 <= lon <= 180 and -90 <= lat <= 90):
        raise ValueError("coordinates out of range")
    return [lon, lat]


def polygon_area_m2(geometry: Geometry | None) -> float | None:
    """Area on a spherical Earth, holes subtracted (same method as geojson-area)."""
    if not geometry or geometry.get("type") != "Polygon":
        return None
    outer, *holes = geometry["coordinates"]
    area = abs(_ring_area(outer)) - sum(abs(_ring_area(h)) for h in holes)
    return round(max(area, 0.0), 1)


def _ring_area(ring: list[list[float]]) -> float:
    n = len(ring)
    if n < 3:
        return 0.0
    total = 0.0
    for i in range(n):
        p1, p2, p3 = ring[i], ring[(i + 1) % n], ring[(i + 2) % n]
        total += (math.radians(p3[0]) - math.radians(p1[0])) * math.sin(math.radians(p2[1]))
    return total * EARTH_RADIUS_M**2 / 2
