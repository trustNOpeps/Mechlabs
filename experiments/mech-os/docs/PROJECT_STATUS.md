# MECH.OS — verification status (26 November 2026)

- Numerical engine: 9 local test groups passed using Node.js.
- Browser (headless Chromium via Python Playwright): 7 local tests passed, including responsive 375px viewport, valid/invalid input behavior, material preset reset, preview controls, STL/CSV/JSON download.
- Notes: Browser tests injected the standalone HTML in a sandbox because navigation was restricted. LocalStorage persistence across navigation, browser Print/PDF, cloud BrowserStack, and multi-browser runs were not yet verified.
- Design: Industrial Technical Workspace; charcoal olive #0e1410, olive surface #18221b, signal lime #c3f268, warning amber #f4aa7f.
- Scope: educational preliminary uniform shaft design only, not safety-certified or a manufacturing specification.
- Deployment: not completed; Vercel reported 403 scope authorization error. No existing production project modified.
