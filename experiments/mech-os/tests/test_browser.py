"""Optional local Chromium UI smoke tests. Run after: node scripts/build.cjs."""
import os
import unittest
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "MECH-OS-standalone.html").read_text(encoding="utf-8")


class BrowserChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        default_path = "/usr/bin/chromium"
        chromium = os.getenv("MECHOS_CHROMIUM", default_path if Path(default_path).exists() else cls.pw.chromium.executable_path)
        cls.browser = cls.pw.chromium.launch(executable_path=chromium, headless=True, args=["--no-sandbox"])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1440, "height": 900}, accept_downloads=True)
        self.page = self.context.new_page()
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.set_content(HTML, wait_until="domcontentloaded", timeout=20000)

    def tearDown(self):
        self.context.close()

    def test_default_metrics_and_console(self):
        self.assertIn("PASS", self.page.locator("#statusBadge").inner_text())
        self.assertIn("49.91", self.page.locator("#vonMises").inner_text())
        self.assertIn("5.01", self.page.locator("#factorOfSafety").inner_text())
        self.assertEqual(self.errors, [])

    def test_invalid_input_and_recovery(self):
        self.page.locator("#diameter").fill("0")
        self.assertIn("INVALID", self.page.locator("#statusBadge").inner_text())
        self.assertTrue(self.page.locator("#exportSTL").is_disabled())
        self.page.locator("#diameter").fill("45")
        self.assertIn("PASS", self.page.locator("#statusBadge").inner_text())
        self.assertTrue(self.page.locator("#exportSTL").is_enabled())

    def test_yield_and_serviceability_checks_are_separate(self):
        self.page.locator("#deflectionLimit").fill("0.001")
        self.assertIn("REVIEW", self.page.locator("#statusBadge").inner_text())
        self.assertEqual(self.page.locator("#yieldStatus").inner_text(), "PASS")
        self.assertEqual(self.page.locator("#deflectionStatus").inner_text(), "REVIEW")

    def test_material_preset_and_reset(self):
        self.page.locator("#material").select_option("aluminium")
        self.assertEqual(self.page.locator("#elasticModulus").input_value(), "69")
        self.page.locator("#force").fill("3000")
        self.page.locator("#loadExample").click()
        self.assertEqual(self.page.locator("#force").input_value(), "1000")
        self.assertEqual(self.page.locator("#elasticModulus").input_value(), "200")

    def test_canvas_keyboard_and_wireframe(self):
        self.page.locator("#toggleWire").click()
        self.assertEqual(self.page.locator("#toggleWire").get_attribute("aria-pressed"), "true")
        self.page.locator("#shaftCanvas").focus()
        before = self.page.locator("#viewTheta").inner_text()
        self.page.keyboard.press("ArrowRight")
        self.assertNotEqual(self.page.locator("#viewTheta").inner_text(), before)
        self.page.locator("#resetView").click()
        self.assertEqual(self.page.locator("#viewTheta").inner_text(), before)

    def test_stl_csv_json_exports(self):
        for control, needle in [
            ("exportSTL", "solid mech_os_shaft_mm"),
            ("exportCSV", '"vonMises"'),
            ("exportJSON", '"schema": "mech.os/shaft-report/v1"'),
        ]:
            with self.page.expect_download(timeout=10000) as download_event:
                self.page.locator("#" + control).click()
            payload = Path(download_event.value.path()).read_text(encoding="utf-8")
            self.assertIn(needle, payload)

    def test_mobile_375px_has_no_horizontal_overflow(self):
        self.page.set_viewport_size({"width": 375, "height": 812})
        dims = self.page.evaluate("({scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth})")
        self.assertLessEqual(dims["scroll"], dims["client"] + 1)
        self.assertTrue(self.page.locator("#exportReport").is_visible())


if __name__ == "__main__":
    unittest.main(verbosity=2)
