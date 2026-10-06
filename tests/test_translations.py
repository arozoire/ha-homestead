"""Every language has every text, with the same placeholders."""

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).parents[1] / "custom_components" / "homestead"
LANGUAGES = ["en", "it", "fr", "de", "es", "nl"]


def _leaves(node, path=""):
    if isinstance(node, dict):
        for key, value in node.items():
            yield from _leaves(value, f"{path}.{key}")
    else:
        yield path, node


def _placeholders(text: str) -> list[str]:
    return sorted(re.findall(r"\{\w+\}", text))


@pytest.mark.parametrize("language", LANGUAGES)
def test_integration_translation(language: str) -> None:
    base = dict(_leaves(json.loads((ROOT / "strings.json").read_text(encoding="utf-8"))))
    other = dict(
        _leaves(json.loads((ROOT / "translations" / f"{language}.json").read_text(encoding="utf-8")))
    )
    assert other.keys() == base.keys()
    assert all(_placeholders(other[k]) == _placeholders(v) for k, v in base.items())


@pytest.mark.parametrize("language", LANGUAGES)
def test_panel_translation(language: str) -> None:
    base = json.loads((ROOT / "frontend" / "i18n" / "en.json").read_text(encoding="utf-8"))
    other = json.loads((ROOT / "frontend" / "i18n" / f"{language}.json").read_text(encoding="utf-8"))
    assert other.keys() == base.keys()
    assert all(_placeholders(other[k]) == _placeholders(v) for k, v in base.items())
