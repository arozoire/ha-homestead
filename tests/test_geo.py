import pytest

from custom_components.homestead.geo import polygon_area_m2, validate_polygon
from custom_components.homestead.models import HomesteadData, Zone

SQUARE = {"type": "Polygon", "coordinates": [[[0, 0], [0.001, 0], [0.001, 0.001], [0, 0.001], [0, 0]]]}


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
