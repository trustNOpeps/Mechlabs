# MECH.OS — verification status (26 November 2026)

- Numerical engine: 9 local test groups passed using Node.js.
- Browser (headless Chromium via Python Playwright): 7 local tests passed, including responsive 375px viewport, valid/invalid input behavior, material preset reset, preview controls, STL/CSV/JSON download.
- Notes: Browser tests injected the standalone HTML in a sandbox because navigation was restricted. LocalStorage persistence across navigation, browser Print/PDF, cloud BrowserStack, and multi-browser runs were not yet verified.
- Design: Industrial Technical Workspace; charcoal olive #0e1410, olive surface #18221b, signal lime #c3f268, warning amber #f4aa7f.
- Scope: educational preliminary uniform shaft design only, not safety-certified or a manufacturing specification.
- Deployment: not completed; Vercel reported 403 scope authorization error. No existing production project modified.


## Follow-up QA and Vercel deployment — 26 November 2026

- Local numerical engine: 12/12 tests passed (additional pure bending and pure torsion cases).
- Local Chromium: 7/7 browser tests passed on standalone HTML injected into an isolated document.
- Independent STL geometry check with trimesh: watertight true; winding consistent true; 96-segment volume relative error approximately -0.07138%.
- Chromium PDF output: two A4 pages generated and text-extracted successfully; native print interaction not tested.
- Actual HTTP navigation to localhost was blocked by browser administrator policy; therefore cross-reload localStorage persistence remains unverified.
- Vercel isolated project: `mech-os-shaft-studio-preview`; deployment `dpl_BuYZ47Yr19FThrSW5k4miHazWP7b` reports READY and build logs show completion. Four application files present.
- **Unexpected platform behavior**: Vercel recorded the first deployment with target `production` despite the explicit `preview` request. This is a newly created separate project with Vercel Authentication enabled; no prior production project, main branch, or custom domain was modified.
- Authenticated cloud browser E2E testing and BrowserStack cross-browser testing have **not** passed or been completed.
- Existing Mechlabs CI workflow updated in the feature branch to execute MECH.OS numerical tests and standalone build.
- Draft PR must remain unmerged until reviewed.

Release disposition: preliminary educational engineering prototype only; protected QA build, no industrial/safety certification or public release sign-off.


## CI recovery and final verification follow-up — 26 November 2026

- Found a reproducible Node module boundary issue: parent Mechlabs uses `"type":"module"`, but the browser-first `src/engine.js` exposes its CommonJS export only under a CommonJS loader. The original CI attempt (GitHub Actions run #18) failed 8 of 9 MECH.OS test cases due to `TypeError: E.analyze is not a function`.
- Added a scoped `experiments/mech-os/package.json` with `"type":"commonjs"` without changing the parent package, math engine, or existing application.
- Reproduced the failure under a parent ESM package locally, then verified the scoped override: 12/12 local numerical tests pass and standalone build succeeds.
- GitHub Actions run #20 (commit `a96d7038914f833d92616d64a7f894339d70439e`) completed **SUCCESS**: parent Mechlabs tests/build and new MECH.OS tests/build all passed.
- Added the optional 7-test Chromium browser suite to this branch for reproducibility; requires Python Playwright and an installed Chromium browser. It is *not* part of GitHub CI because the workflow does not provision browser dependencies.
- Browser navigation to local and intercepted HTTPS URLs is blocked by administrator policy in this execution environment; localStorage cross-reload and real cloud browser E2E still **NOT VERIFIED**.
- The isolated Vercel build remains READY but corresponds to the earlier commit `f8a928ce1fe72c25f5e734897bdfc533e7aaf623`, not the latest GitHub feature branch. No new deployment was performed during CI repair.
- Keep pull request `#1` in draft pending browser-accessible QA and explicit release approval.


## Public hosting verification — 26 November 2026

- Public address: https://mech-os-shaft-studio-preview.vercel.app/
- Isolated Vercel project ID: `prj_9GI2Pvgo7Vt6pSgnrGIxfnFAunHH`; deployment `dpl_CtEjdriAdk7b1FWFpgwZeacCKzmV` was READY after the current main branch accessibility contrast change (`85b29866d4e3b31b44fd11cfe606d7fea7207e8f`).
- Vercel project reports: Vercel Authentication disabled, password protection disabled, trusted IP restriction disabled, domain verified. This is a *public demo* project, not an engineering-certified production system.
- BrowserStack Website Accessibility Scanner successfully scanned the actual public URL with WCAG 2.2 AA checks, confirming browser-level reachability without a logged-in Vercel session.
- Initial scan ID 4370080: 92/100 accessibility score; 38 flagged issues.
- After targeted CSS contrast improvements, scan ID 4370081: 92/100, 26 flagged issues (23 require manual review; 2 are best-practice notes). The reduction in flagged occurrences does **not** establish WCAG conformance. Further manual review is required.
- BrowserStack live functional E2E tests across Safari/Firefox and browser storage persistence across reloads remain NOT VERIFIED. Prior local Chromium UI tests and GitHub CI were successful before contrast-only CSS changes.
- Deployment is generated from GitHub main source via explicit Vercel API upload; automatic Git-to-Vercel sync is not configured. Subsequent pushes to GitHub will NOT deploy automatically unless Git integration is added.
