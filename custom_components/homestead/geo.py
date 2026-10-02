"""Map geometry helpers and KML/KMZ/GeoJSON parsing (no Home Assistant dependency).

Geometries are GeoJSON dicts with [longitude, latitude] coordinates.
"""

from __future__ import annotations

import io
import json
import math
import zipfile
from typing import Any
from xml.etree import ElementTree

EARTH_RADIUS_M = 6378137

Geometry = dict[str, Any]


class MapFormatError(ValueError):
    """The file is not a readable KML, KMZ or GeoJSON map."""


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


def parse_map(filename: str, content: bytes) -> tuple[list[dict[str, Any]], int]:
    """Return (features, skipped): points and polygons with their names.

    Lines and unsupported geometries are counted in `skipped`.
    """
    name = filename.lower()
    if name.endswith(".kmz") or content[:2] == b"PK":
        return _parse_kml(_unzip_kml(content))
    if name.endswith((".geojson", ".json")) or content.lstrip()[:1] == b"{":
        return _parse_geojson(content)
    return _parse_kml(content)


def _unzip_kml(content: bytes) -> bytes:
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as archive:
            kml = next((n for n in archive.namelist() if n.lower().endswith(".kml")), None)
            if kml is None:
                raise MapFormatError("KMZ without a .kml file")
            return archive.read(kml)
    except zipfile.BadZipFile as err:
        raise MapFormatError("damaged KMZ file") from err


def _parse_geojson(content: bytes) -> tuple[list[dict[str, Any]], int]:
    try:
        data = json.loads(content)
    except (UnicodeDecodeError, json.JSONDecodeError) as err:
        raise MapFormatError("invalid GeoJSON") from err
    if not isinstance(data, dict):
        raise MapFormatError("invalid GeoJSON")
    if data.get("type") == "FeatureCollection":
        items = data.get("features") or []
    elif data.get("type") == "Feature":
        items = [data]
    else:
        items = [{"type": "Feature", "geometry": data, "properties": {}}]
    features: list[dict[str, Any]] = []
    skipped = 0
    for item in items:
        props = (item or {}).get("properties") or {}
        label = next((str(props[k]) for k in ("name", "Name", "NAME", "title") if props.get(k)), "")
        skipped += _add_geometry(features, label.strip(), (item or {}).get("geometry"))
    return features, skipped


def _add_geometry(features: list[dict[str, Any]], name: str, geometry: Any) -> int:
    if not isinstance(geometry, dict):
        return 1
    kind, coords = geometry.get("type"), geometry.get("coordinates")
    try:
        if kind == "Point":
            features.append({"name": name, "geometry": {"type": "Point", "coordinates": _point(coords)}})
            return 0
        if kind == "Polygon":
            features.append({"name": name, "geometry": validate_polygon(geometry)})
            return 0
        if kind == "MultiPoint":
            return sum(_add_geometry(features, name, {"type": "Point", "coordinates": c}) for c in coords)
        if kind == "MultiPolygon":
            return sum(_add_geometry(features, name, {"type": "Polygon", "coordinates": c}) for c in coords)
        if kind == "GeometryCollection":
            return sum(_add_geometry(features, name, g) for g in geometry.get("geometries") or [])
    except (TypeError, ValueError):
        return 1
    return 1


def _parse_kml(content: bytes) -> tuple[list[dict[str, Any]], int]:
    try:
        root = ElementTree.fromstring(content)
    except ElementTree.ParseError as err:
        raise MapFormatError("invalid KML") from err
    features: list[dict[str, Any]] = []
    skipped = 0
    for placemark in _all(root, "Placemark"):
        name = (_child_text(placemark, "name") or "").strip()
        found = False
        for element in placemark.iter():
            tag = _tag(element)
            if tag == "Point":
                coords = _kml_coords(element)
                if coords:
                    skipped += _add_geometry(features, name, {"type": "Point", "coordinates": coords[0]})
                    found = True
            elif tag == "Polygon":
                outer = [_kml_coords(b) for b in element if _tag(b) == "outerBoundaryIs"]
                inner = [_kml_coords(b) for b in element if _tag(b) == "innerBoundaryIs"]
                skipped += _add_geometry(features, name, {"type": "Polygon", "coordinates": outer + inner})
                found = True
            elif tag == "LineString":
                skipped += 1
                found = True
        if not found:
            skipped += 1
    return features, skipped


def _tag(element: ElementTree.Element) -> str:
    return element.tag.rsplit("}", 1)[-1] if isinstance(element.tag, str) else ""


def _all(root: ElementTree.Element, tag: str) -> list[ElementTree.Element]:
    return [e for e in root.iter() if _tag(e) == tag]


def _child_text(element: ElementTree.Element, tag: str) -> str | None:
    return next((c.text for c in element if _tag(c) == tag), None)


def _kml_coords(element: ElementTree.Element) -> list[list[float]]:
    text = next((e.text for e in element.iter() if _tag(e) == "coordinates"), None) or ""
    try:
        return [[float(v) for v in chunk.split(",")[:2]] for chunk in text.split() if "," in chunk]
    except ValueError:
        return []
