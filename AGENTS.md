# Notes for AI coding agents

You are working on **HA Homestead**, a Home Assistant custom integration (HACS) with its own panel, for vegetable gardens, orchards and small homesteads.

Read first:
1. [CONTRIBUTING.md](CONTRIBUTING.md): the project's rules and why they exist. Follow them.
2. `docs/design/` for the area you touch:
   - [ui.md](docs/design/ui.md) for any panel change;
   - [crop-calendars.md](docs/design/crop-calendars.md) for crop data and climate;
   - [supplies.md](docs/design/supplies.md) for stocks, products and the shopping list.
3. `CLAUDE.md` and `SPEC.md` are the maintainer's history in Italian: background only. Do **not** edit `CLAUDE.md` in a contribution; describe your change in the PR instead.

Commands:

```bash
pip install -r requirements_test.txt ruff   # Python 3.14
ruff check custom_components tests && ruff format --check custom_components tests
pytest                                      # the full suite
```

Hard rules:
- **Do not edit, move or delete** `AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `SPEC.md`, `docs/design/`, `.github/` (workflows, templates, `CODEOWNERS`). They belong to the maintainer: propose changes in an issue.
- `models.py` imports nothing from Home Assistant.
- Every user-visible text in **6 languages**, in `translations/` and `frontend/i18n/`, with the same keys and placeholders.
- The panel stays one vanilla web component: no framework, no build step, no CDN.
- Stored data stays readable by newer versions; never drop old fields silently.
- Do not bump the version in `manifest.json` (it triggers a release).
- One topic per PR; anything larger than a fix starts with an issue.
- **Work only on topics taken by your user** (see "Who works on what" in CONTRIBUTING.md and the issue). A topic taken by someone else is not yours, even if you see an easy fix: tell your user instead.
- Domain rules (sowing, pruning, harvest, frost, water) must be right in more than one climate. Show expected values in tests.
