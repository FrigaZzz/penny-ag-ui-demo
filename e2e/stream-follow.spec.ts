import { test, expect } from "@playwright/test";

test("central stream follows layout growth, pauses for reading, and resumes", async ({ page }) => {
  await page.route("**/stream-follow-fixture", (route) => route.fulfill({
    contentType: "text/html",
    body: `<div id="root"></div><script type="module">
      import RefreshRuntime from '/@react-refresh';
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
      await import('/e2e/stream-fixture.tsx');
    </script>`,
  }));
  await page.goto("/stream-follow-fixture");
  const workspace = page.locator(".workspace");
  await expect(page.getByRole("status")).toHaveText("Following");
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Append record" }).click();
  await expect.poll(() => workspace.evaluate((el) => el.scrollTop)).toBeGreaterThan(400);
  await workspace.hover();
  await page.mouse.wheel(0, -180);
  await expect(page.getByRole("status")).toHaveText("Paused");
  await page.waitForTimeout(250);
  const paused = await workspace.evaluate((el) => el.scrollTop);
  await page.getByRole("button", { name: "Append record" }).click();
  await page.waitForTimeout(100);
  expect(await workspace.evaluate((el) => el.scrollTop)).toBe(paused);
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Following");
  await expect.poll(() => workspace.evaluate((el) => el.scrollTop)).toBeGreaterThan(paused + 100);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 640 });
    await page.getByRole("button", { name: "Append record" }).click();
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});
