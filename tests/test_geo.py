import io
import json
import zipfile

import pytest

from custom_components.homestead.geo import MapFormatError, parse_map, polygon_area_m2, validate_polygon
from custom_components.homestead.models import HomesteadData, Zone

SQUARE = {"type": "Polygon", "coordinates": [[[0, 0], [0.001, 0], [0.001, 0.001], [0, 0.001], [0, 0]]]}

KML = b"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Folder>
  <Placemark><name> Melo </name><Point><coordinates>7.6869,45.0700,0</coordinates></Point></Placemark>
  <Placemark><name>Orto</name><Polygon>
    <outerBoundaryIs><LinearRing><coordinates>
      7.0,45.0,0 7.001,45.0,0 7.001,45.001,0 7.0,45.001,0 7.0,45.0,0
    </coordinates></LinearRing></outerBoundaryIs>
  </Polygon></Placemark>
  <Placemark><name>Recinzione</name>
    <LineString><coordinates>7,45 7.1,45.1</coordinates></LineString></Placemark>
</Folder></Document></kml>"""


def test_polygon_area():
    assert polygon_area_m2(SQUARE) == pytest.approx(12392, rel=0.01)
    with_hole = {"type": "Polygon", "coordinates": [*SQUARE["coordinates"], SQUARE["coordinates"][0]]}
    assert polygon_area_m2(with_hole) == 0
    assert polygon_area_m2(None) is None


def test_validate_polygon_closes_ring_and_rejects_bad_input():
    open_ring = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1]]]}
    assert validate_polygon(open_ring)["coordinates"][0][-1] == [0, 0]
    for bad in (
        {"type": "Point", "coordinates": [0, 0]},
        {"type": "Polygon", "coordinates": [[[0, 0], [1, 1]]]},
    ):
        with pytest.raises(ValueError):
            validate_polygon(bad)
    with pytest.raises(ValueError):
        validate_polygon({"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 200]]]})


def test_zone_area_follows_geometry():
    zone = Zone(name="Orto", geometry=SQUARE)
    assert zone.area_m2 == pytest.approx(12392, rel=0.01)
    assert Zone.from_dict({**zone.to_dict(), "geometry": None}).area_m2 is None


def test_zone_descendants():
    data = HomesteadData()
    a, b, c = Zone(name="A"), Zone(name="B"), Zone(name="C")
    b.parent_id, c.parent_id = a.id, b.id
    data.zones = {z.id: z for z in (a, b, c)}
    assert data.zone_descendants(a.id) == {b.id, c.id}


def test_parse_kml_and_kmz():
    features, skipped = parse_map("mappa.kml", KML)
    assert [(f["name"], f["geometry"]["type"]) for f in features] == [("Melo", "Point"), ("Orto", "Polygon")]
    assert features[0]["geometry"]["coordinates"] == [7.6869, 45.07]
    assert skipped == 1

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w") as archive:
        archive.writestr("doc.kml", KML)
    assert parse_map("My Maps.kmz", buffer.getvalue())[0] == features


def test_parse_geojson():
    collection = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "Pero"},
                "geometry": {"type": "Point", "coordinates": [7, 45]},
            },
            {
                "type": "Feature",
                "properties": {},
                "geometry": {"type": "MultiPolygon", "coordinates": [SQUARE["coordinates"]]},
            },
            {
                "type": "Feature",
                "properties": {},
                "geometry": {"type": "LineString", "coordinates": [[0, 0], [1, 1]]},
            },
            {"type": "Feature", "properties": {}, "geometry": None},
        ],
    }
    features, skipped = parse_map("export.geojson", json.dumps(collection).encode())
    assert [(f["name"], f["geometry"]["type"]) for f in features] == [("Pero", "Point"), ("", "Polygon")]
    assert skipped == 2


@pytest.mark.parametrize(
    ("name", "content"), [("a.kml", b"<kml"), ("a.geojson", b"{nope"), ("a.kmz", b"PK\x03\x04bad")]
)
def test_parse_errors(name, content):
    with pytest.raises(MapFormatError):
        parse_map(name, content)
