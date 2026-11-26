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


    def test_mobile_result_first_and_collapsible_sections(self):
        self.page.set_viewport_size({"width": 375, "height": 812})
        self.page.set_content(HTML, wait_until="domcontentloaded")
        status = self.page.locator("#statusBadge").inner_text()
        self.assertIn("PASS", status)
        self.assertLess(
            self.page.locator("#analysis-section").bounding_box()["y"],
            self.page.locator("#inputs-section").bounding_box()["y"],
        )
        self.assertFalse(self.page.locator('details[data-group="material-properties"]').evaluate("(e) => e.open"))
        self.assertFalse(self.page.locator('details[data-group="serviceability-and-cost"]').evaluate("(e) => e.open"))
        self.page.locator('details[data-group="material-properties"] > summary').click()
        self.assertTrue(self.page.locator('details[data-group="material-properties"]').evaluate("(e) => e.open"))
        self.assertEqual(self.page.evaluate("document.documentElement.scrollWidth"), 375)

    def test_touch_orbit_does_not_intercept_scroll_until_enabled(self):
        self.page.set_viewport_size({"width": 375, "height": 812})
        self.page.set_content(HTML, wait_until="domcontentloaded")
        toggle = self.page.locator("#toggleTouchOrbit")
        self.assertTrue(toggle.is_visible())
        canvas = self.page.locator("#shaftCanvas")
        self.assertEqual(canvas.evaluate("(e)=>getComputedStyle(e).touchAction"), "pan-y")
        toggle.click()
        self.assertEqual(toggle.get_attribute("aria-pressed"), "true")
        self.assertEqual(canvas.evaluate("(e)=>getComputedStyle(e).touchAction"), "none")
        toggle.click()
        self.assertEqual(canvas.evaluate("(e)=>getComputedStyle(e).touchAction"), "pan-y")

    def test_responsive_widths_and_mobile_navigation(self):
        for width in (320, 375, 390, 430, 768, 1280):
            self.page.set_viewport_size({"width": width, "height": 900})
            self.page.set_content(HTML, wait_until="domcontentloaded")
            dims = self.page.evaluate("({s:document.documentElement.scrollWidth,c:document.documentElement.clientWidth})")
            self.assertLessEqual(dims["s"],dims["c"]+1, f"horizontal overflow at {width}px")
            self.assertIn("49.91",self.page.locator("#vonMises").inner_text())
            if width <= 430:
                self.assertEqual(self.page.locator(".rail").evaluate("(e)=>getComputedStyle(e).position"), "fixed")
                self.assertGreaterEqual(self.page.locator(".rail-link").first.bounding_box()["width"],44)

    def test_mobile_375px_has_no_horizontal_overflow(self):
        self.page.set_viewport_size({"width": 375, "height": 812})
        dims = self.page.evaluate("({scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth})")
        self.assertLessEqual(dims["scroll"], dims["client"] + 1)
        self.assertTrue(self.page.locator("#exportReport").is_visible())


class HostedPersistenceChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from functools import partial
        from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
        from threading import Thread
        handler=partial(SimpleHTTPRequestHandler,directory=str(ROOT))
        cls.server=ThreadingHTTPServer(("127.0.0.1",0),handler)
        cls.thread=Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.url=f"http://127.0.0.1:{cls.server.server_port}/"
        cls.pw=sync_playwright().start()
        cls.browser=cls.pw.chromium.launch(headless=True,args=["--no-sandbox"])

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def test_save_study_persists_across_reload(self):
        context=self.browser.new_context(viewport={"width":375,"height":812})
        page=context.new_page()
        page.goto(self.url,wait_until="load")
        self.assertIn("PASS",page.locator("#statusBadge").inner_text())
        page.locator("#saveStudy").click()
        self.assertEqual(page.locator("#historyCount").inner_text(),"01")
        page.reload(wait_until="load")
        self.assertEqual(page.locator("#historyCount").inner_text(),"01")
        page.locator("#setBaseline").click()
        self.assertIn("Shaft concept A",page.locator("#baselineName").inner_text())
        page.reload(wait_until="load")
        self.assertIn("Shaft concept A",page.locator("#baselineName").inner_text())
        context.close()


if __name__ == "__main__":
    unittest.main(verbosity=2)
