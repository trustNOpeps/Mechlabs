# MECH.OS — release verification (26 November 2026)

## Current release

**MECH.OS Shaft Studio v0.3 is live as a public portfolio prototype.**

- **Public demo:** https://mech-os-shaft-studio-preview.vercel.app/
- **Source:** https://github.com/trustNOpeps/Mechlabs/tree/main/experiments/mech-os
- **GitHub release PR:** https://github.com/trustNOpeps/Mechlabs/pull/2 — merged as `7cd9d8af2ea26ed5628429c0c69ea1c862f44934`
- **Latest code source commit:** `cdbbbc3d71cdfddd21de3db81036281915f4a45f` (semantic table / autocomplete fix)
- **Vercel deployment ID:** `dpl_6QmyofDKCSRF6urnavEBfA5KU3PN` — READY, aliases assigned; Vercel Authentication/password/IP restrictions disabled
- **Public URL independently accessed:** BrowserStack Website Accessibility Scanner, scan ID `4370117`, run ID `2499547`

## Design and mobile acceptance

- Industrial Technical visual system retained: dark olive/charcoal, signal lime and restrained monospace metadata.
- Mobile `320 / 375 / 390 / 430` px and desktop `768 / 1280` px checked locally for horizontal overflow — none.
- Results-first layout on mobile; an Edit parameters jump link; collapsible geometry/loads/material/cost groups.
- Bottom fixed mobile navigation with 44+ px touch targets.
- Touch scrolling on canvas defaults to normal page scroll; explicit Orbit mode enables touch drag.
- Canvas keyboard arrows, wireframe toggle, reset, live calculations and file exports remain available.

## Test evidence

- [GitHub Actions workflow #48](https://github.com/trustNOpeps/Mechlabs/actions/runs/45759976867): **SUCCESS**, all steps passed: Mechlabs tests and build; MECH.OS Node tests and standalone build; Playwright Chromium browser tests.
- CI reports 9 Node engineering test cases and 11 browser tests including 320–1280px viewports, touch orbit controls, downloads, validation, and actual HTTP localStorage persistence across reloads.
- Local expanded prototype suite previously passed 12 numerical checks; local Chromium regression passed 7 UI checks after the final semantic/contrast edits. This local suite is separate from GitHub's CI tests.
- STL was independently checked as watertight with consistent winding; 96-segment triangulated volume error was approximately 0.0714% relative to an ideal cylinder.
- Automated BrowserStack WCAG 2.2 AA scan of current public URL: **94/100**, 23 color-contrast items marked `needs review`; no confirmed issues from this scan, but **formal accessibility conformance is NOT established**. Scan dashboard: https://accessibility.browserstack.com/site-scanner/projects/MECH.OS%20v0.3%20release%20final%20accessibility%20follow-up/builds?thBuildId=ruqp4gugbw2aypcllvcohrmv5rkrqpgsoiyismyy

## Boundaries and known external dependency

- **Git-to-Vercel automatic deployment is not connected.** Attempted Vercel Git project linking failed: `You need to add a Login Connection to your GitHub account first.` This GitHub account permission must be granted in the user's Vercel account. The live release is currently deployed from the GitHub source via Vercel API and must be refreshed for future changes.
- BrowserStack automated accessibility scan and GitHub Chromium tests are confirmed; interactive Safari/Firefox cloud-browser QA and manual WCAG audit are not claimed.
- Educational preliminary uniform shaft only, with static central transverse load and constant simultaneous torque. No fatigue, notches/keyways, bearing interaction, critical speed, dynamic/thermal loads, tolerances or manufacturing sign-off.
- The PASS state indicates *only* the modeled static yield requirement and optional deflection threshold; not a safe-to-manufacture or certified design.
- Cost values and generic material presets are illustrative, not verified market/supplier data.

## Release disposition

**PORTFOLIO MVP — PUBLIC DEMO LIVE.** Engineering design certification, full accessibility conformance and automatic Git integration are outside the verified completion boundary.
