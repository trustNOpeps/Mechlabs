# MECH.OS — Shaft Studio v0.3

**[Public live demo](https://mech-os-shaft-studio-preview.vercel.app/)** · [GitHub Actions](https://github.com/trustNOpeps/Mechlabs/actions) · [Verification status](docs/PROJECT_STATUS.md)

**Mechanical Engineering × Software Engineering.** An offline-first educational engineering workspace for preliminary analysis of a **uniform solid round shaft**. It combines a deterministic calculation engine, interactive rotatable mesh visualization, explicit design checks, saved studies, baseline comparisons, and local file exports.

## Run

1. Open `index.html` in Chrome, Firefox, Safari or Edge. No install, database, API key, browser plugin, cloud account, or internet connection required.
2. Alternatively serve with `python -m http.server 8000` and navigate to `http://localhost:8000`.
3. Run `node --test tests/engine.test.cjs` (Node 20+) for numerical tests. The nested `package.json` explicitly isolates the CommonJS engine from the parent TanStack/ESM workspace.
4. Run `node scripts/build.cjs` to generate `MECH-OS-standalone.html`.
5. Optionally run `python -m unittest discover -s tests -p test_browser.py -v` after building; requires Python Playwright and a Chromium executable (`MECHOS_CHROMIUM` may override its path). Browser tests inject the standalone HTML into a fresh page; they do not prove persistence across navigation or authenticated cloud browser behavior.

## Mobile-first interaction (v0.3)

- Mobile displays the main engineering results before the design input form. A prominent **Edit parameters** link jumps directly to input fields.
- Geometry and load inputs are initially expanded; material properties and serviceability/cost fields are collapsible on phones to reduce scrolling.
- Five-module navigation moves to a bottom touch bar with 44+ px touch targets.
- The geometry canvas defaults to normal vertical page scrolling on touch screens. **Orbit: off/on** explicitly enables touch rotation and disables touch scrolling only inside the canvas while active. Desktop mouse orbit and keyboard arrow navigation remain available.
- Small phone widths 320–430 px have responsive, accessible input columns and action controls.
- CI additionally runs Chromium browser tests, checking mobile layout, exports, and saved-studies persistence across actual HTTP page reloads. See [GitHub Actions](https://github.com/trustNOpeps/Mechlabs/actions).

## Design system

Direction: **industrial technical / restrained retro-control interface**. Dark charcoal olive (`#0e1410`), darker surface (`#18221b`), signal lime (`#c3f268`), warning amber (`#f4aa7f`). Compact high-contrast monospaced metadata, large editorial headings, restrained borders, desktop-first responsive grid. Canvas renders an interactive orthographic 3D mesh with rotate/wireframe toggles; it is **not** precision CAD or a B-rep model.

## Formulae, units and assumptions

| Quantity | Formula | Unit |
| --- | --- | --- |
| Midpoint maximum bending moment | M = FL/4 | N·mm |
| Second moment of area | I = πd⁴/64 | mm⁴ |
| Polar moment of inertia | J = πd⁴/32 | mm⁴ |
| Maximum bending stress | σ = 32M/(πd³) | MPa |
| Maximum torsional shear | τ = 16T/(πd³) | MPa; T in N·mm |
| Von Mises stress | σv = √(σ² + 3τ²) | MPa |
| Yield FoS | n = Sy/σv | dimensionless |
| Midpoint deflection | δ = FL³/(48EI) | mm; E in MPa |
| Shaft mass | m = πd²Lρ/4 × 10⁻⁹ | kg, ρ in kg/m³ |

Assumptions: simply supported beam, one central transverse force, uniform diameter along span, constant simultaneous torque, linear-elastic response, Euler–Bernoulli bending, isotropic material, static von Mises yielding. Torque entered in N·m converts to N·mm; elastic modulus entered in GPa converts to MPa. The minimum diameter solves a **static yielding** equation only, not deflection or fatigue. A 0 mm deflection limit means the check is disabled (not a 0 mm allowable limit). When both loads are zero, the FoS is mathematically infinite and minimum strength diameter zero, but real shafts must still satisfy geometry and other engineering requirements.

The **PASS** label means only the specified static yield factor of safety **and** optional user-defined deflection threshold are met. It is NOT certification for manufacture or operation. No fatigue, stress concentration, keyways, bearing reaction/contact loads, critical speeds, torque gradients, buckling, thermal stress, geometric tolerance or complex loading checks. Material presets are generic illustrative examples, NOT recognized grades or datasheets. Cost is raw material × user rate × explicit allowance, not a machining/fabrication quotation. STL is an approximate closed triangulated cylindrical shell in **nominal millimetres**; STL has no explicit unit metadata.

## Source references

- [Engineering LibreTexts, Beam Displacements — section 4.3](https://eng.libretexts.org/Bookshelves/Mechanical_Engineering/Mechanics_of_Materials_%28Roylance%29/04%3A_Bending/4.03%3A_Beam_Displacements) for elementary beam displacement derivations.
- [CadQuery documentation](https://cadquery.readthedocs.io/en/stable/) for future true parametric CAD and STEP export: not implemented in this version.
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) for keyboard focus, reduced-motion design and content contrast goals; no formal WCAG conformance audit has been performed.

## Files

```
index.html           semantic web interface
src/styles.css       responsive design system
src/engine.js        pure deterministic formulas, STL, report/CSV generators
src/app.js           UI interactions, canvas, local study library
scripts/build.cjs    generates standalone offline HTML
tests/engine.test.cjs unit tests
tests/test_browser.py optional Chromium browser functional checks
```

## Safety, privacy & versioning

- No external network calls; no tokens, analytics, user accounts or cloud storage.
- Studies/baseline are stored only in this browser's localStorage. Clear browser site data to remove them; there is no cloud backup.
- CSV, JSON and STL are generated client-side. Print report uses the browser's native print dialog.
- Inputs are validated and escaped on insertion in the DOM. The engineering core is shared by Node and browser test runtimes.
- This is a prototype for learning and portfolio demonstration, not design sign-off software.

## Release milestones

- v0.1: single shaft static yield + CSV/STL baseline
- v0.2: industrial UI + live rotatable geometry + input validation + deflection threshold + local saved runs + baseline + reporting + tests\n- **v0.3: mobile results-first workflow + collapsible parameter groups + touch orbit toggle + bottom navigation + extended browser CI**
- v0.3: independent mechanics validation tables, manufacturing geometry variants, real CAD via optional CadQuery service, DXF/STEP, and controlled preview deployment
- v1.0: engineering verification, documentation, accessibility and QA review, provenance, releases

Product branding and UI design authored for MECH.OS; do not represent this as an industrially certified engineering tool.