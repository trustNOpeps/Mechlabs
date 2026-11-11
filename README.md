# MechLabs — Engineering Workbench

**Independent educational project** by Hamka / [trustNOpeps](https://github.com/trustNOpeps).

**[Live demo](https://mechlabs-engineering.lovable.app/)** · [Portfolio case study](https://github.com/trustNOpeps/trustNOpeps/blob/main/projects/mechlabs.md)

A small browser-first toolkit for tensile-calculation learning, unit conversions, user-entered material comparisons and local experiment records.

## Modules
- **Workbench:** engineering stress σ = F/A₀ and strain ε = ΔL/L₀, XY chart, clearly synthetic sample data and CSV export.
- **Unit Lab:** N/kN/lbf, MPa/Pa/GPa/psi, mm/cm/m/in.
- **Material Compare:** source-tagged user-provided inputs; no assumed certified material properties.
- **Saved Runs:** browser-local persistence, rename/delete/export.
- **About:** scope, equations and limitations.

## Run from source

The app was originally generated on Lovable with React, TanStack Start, TypeScript, Vite and Tailwind.

```bash
bun install --frozen-lockfile
bun run test
bun run build
bun run dev
```

This directory is a **one-time source snapshot** of the Lovable project as of November 2026, not an automatically synced branch. Its deployed version is linked above. The live app can change independently until GitHub sync is connected.

## Engineering limits

For learning only. No ASTM/ISO certification, laboratory affiliation or safety-critical use. Browser-local data is not cloud-backed. The optional ratio σ/ε is a single-point secant slope, not a verified Young's modulus.

The source includes deterministic engineering unit tests. See this repository's [standalone test and build workflow](.github/workflows/tests.yml) and its [Actions runs](https://github.com/trustNOpeps/mechlabs/actions) for the current results. The original [portfolio CI](https://github.com/trustNOpeps/trustNOpeps/blob/main/.github/workflows/mechlabs-ci.yml) also covered the snapshot before extraction. The public Lovable deployment may change independently of this archived source snapshot.
