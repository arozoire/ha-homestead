# Contributing to HA Homestead

Thanks for wanting to help. Pull requests are welcome. This page explains what the project cares about, so that your work fits and can be merged without long back-and-forth.

AI assistants (Claude Code, Codex, Copilot…) are fine. Read [AGENTS.md](AGENTS.md) and make sure your assistant reads it too. You stay responsible for what the PR does in a real garden, not only for the code.

## Before you write code

- **Small fix** (a bug, a typo, a missing translation): open the PR directly.
- **Anything bigger**: open an issue first and say what you want to change and why. Wait for a "yes, go".
  - Examples: a new feature, a new data field, a change of behaviour, anything in the panel layout.
  - Why: the maintainer often has a plan for that area already (see `docs/design/`). A short talk saves you days of work that would not be merged.
- **One topic per PR.** Two unrelated changes = two PRs.
- **Panel changes:** a sketch or a screenshot in the issue helps a lot. Read [docs/design/ui.md](docs/design/ui.md) first.

## What the project cares about (and why)

| Rule | Why |
|---|---|
| **Do not litter Home Assistant**: no areas, floors or labels created; few aggregated entities; per-plant devices only opt-in; clean removal | Many users run big HA installs; the garden must not flood them with entities |
| **Local first**: no cloud account, no paid API, no ads. Open data only (GBIF, Wikidata, Open-Meteo, CropGraph CC-BY-4.0) | The author's rule, and HACS users expect it |
| **Little typing for the user**: what can be computed is computed and shown by itself (season index, water balance, hens count, chill hours…) | The user is in the garden with dirty hands and a phone |
| **Works worldwide**, not only for the author's garden: climate from the garden's own history, units metric or imperial, 6 languages | Users are in Italy, France, Arizona… A rule that is right in one climate and wrong in another is a bug |
| **Never lose user data**: stored data stays readable by newer versions; old values are converted in `__post_init__`, not dropped | Diaries cover many years |
| **Domain correctness over code elegance**: an agronomic rule must be right (pruning season, harvest months, frost limits) | A clean function that says "prune cherries in winter" is worse than no function |
| **The panel has no build step**: one vanilla web component, no framework, no bundler, no CDN | Installs from HACS as plain files; nothing to compile, nothing to break |

## Project map

| Where | What |
|---|---|
| `custom_components/homestead/models.py` | Plain dataclasses, **no Home Assistant import** (testable alone). Enum values in English |
| `store.py`, `services.py`, `websocket_api.py` | Storage in `.storage/homestead.data`; every write goes through a service that answers with the id |
| `outlook.py`, `forecast.py`, `weather.py`, `climate.py`, `water.py`, `forecast_log.py`, `crops.py`, `irrigation.py` | Weather, climate history, alerts, advice, crop data, valves. Pure modules (no HA) where possible |
| `frontend/homestead-panel.js` | The whole panel (vanilla web component). Texts in `frontend/i18n/<lang>.json` |
| `translations/`, `strings.json` | HA texts (services, options, selectors). `strings.json` = English = `translations/en.json` |
| `tests/` | pytest with `pytest-homeassistant-custom-component` |
| `docs/design/` | Agreed designs for larger areas: read the one for the area you touch |
| `CLAUDE.md`, `SPEC.md` | The maintainer's history and decisions, in Italian. Useful background, not required |

## Files that only the maintainer changes

`AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `SPEC.md`, `docs/design/` and `.github/` (workflows, templates, `CODEOWNERS`) hold the project's rules and release process. Do not edit, move or delete them in a PR; if you think a rule is wrong, say so in an issue.

## Checklist for a PR

1. `ruff check custom_components tests && ruff format --check custom_components tests`
2. `pytest` (the full suite: single files can fail on import order). Add tests for new behaviour.
3. **Texts in all 6 languages** (en, it, fr, de, es, nl), in `translations/` **and** `frontend/i18n/`, same keys and placeholders (`tests/test_translations.py` checks it). A careful machine translation is fine; say so in the PR.
4. Units: store metric; show through the panel helpers (`deg`, `rainText`, `formatArea`…) so imperial users see °F, inches, acres.
5. Stored data: new fields get a default; old data must load unchanged.
6. **Do not change the version** in `manifest.json`: merging a version change publishes a release, and the maintainer decides when.
7. Fill the PR template: why, what, how you tested (in a real HA? with which data?).
8. Panel: say on which screen sizes you checked it (phone ~390 px and computer).

## How PRs are reviewed

- The maintainer reads the **behaviour in a real garden** first, then the code. Expect questions like "what does this show in Italy in May?".
- Large changes can be merged with changes on top, or the idea taken and built differently; we will say which before you invest more time.
- Releases group several PRs; your work is credited in the release notes.

## Who works on what

- Every topic open to contributors comes from a **GitHub issue**. The table below lists them with the person who took each one.
- **A taken topic belongs to that person.** Others, and their AI agents, do not work on it. If you have an idea for it, say so in its issue.
- **To take a free topic**, comment in its issue ("I'll take this") and wait for the maintainer's OK. Issues open to anyone carry the `help wanted` label.
- Open a **draft PR early**, so that everyone sees the work is moving.
- **Two weeks without a draft PR or news** and the topic becomes free again.
- The maintainer may work on any topic, and decides when two pieces of work overlap.

## Contributions that are wanted now

| Topic | Issue | Taken by | Notes |
|---|---|---|---|
| Crop calendars from the garden's own climate, worldwide | #51 | `FedgarLurch` | Follow [docs/design/crop-calendars.md](docs/design/crop-calendars.md) |
| Irrigation: meter lost or reset during a run, measured / estimated / incomplete volumes | #52 | `vico34` | Small, with regression tests. Suggested field: `Event.measure` |
| Explain recommendations: source, freshness and reason of each advice | #52 | `vico34` | Start with the water balance |
| Fish breeding: spawning, hatching, life stages with their own water targets | #47 | `vico34` (invited) | Builds on the fish lots of 0.24.0 |

Other plans in `docs/design/` (for example [supplies.md](docs/design/supplies.md)) are built by the maintainer unless an issue says otherwise.

## Out of scope (for now)

- Pets (dogs, cats).
- Anything that needs a cloud account, a paid service or ads.
- A frontend build step, a framework, or splitting the panel into many files in one go. Small, separate extractions may come later, discussed first: they conflict with every open PR.
- Biodiversity logged by hand. Automatic detection (BirdNET-Go) is planned by the maintainer.
