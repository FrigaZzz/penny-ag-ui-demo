import { test, expect } from "@playwright/test";

test("real ADK: streaming, shared state, HITL, interrupts, dashboard, and generated HTML", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const backend = "http://127.0.0.1:8001";
  const health = await (await request.get(backend + "/api/health")).json();
  const original = await (await request.get(backend + "/api/budget")).json();
  const approvals = original.approvals;
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Make room for what matters." }),
  ).toBeVisible();

  // Shared state: a real UI edit is read back by the agent.
  await page.locator("#savings-goal").fill("1700");
  await page.getByRole("button", { name: "Update goal", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Build a savings plan", exact: false })
    .click();
  await expect(page.locator(".workspace .plan-row").first()).toBeVisible();
  const partialCount = await page.locator(".workspace .plan-row").count();
  if (health.native_argument_streaming) expect(partialCount).toBeLessThan(8);
  await expect(page.locator(".workspace .plan-row")).toHaveCount(8);
  await expect(page.getByLabel("Message Penny")).toBeEnabled();
  await expect(page.locator(".workspace .plan-total")).toContainText(
    /\$1,[7-9]\d\d|\$[2-5],\d\d\d/,
  );
  expect(
    (await (await request.get(backend + "/api/budget")).json()).approvals,
  ).toBe(approvals);

  // Native ADK interrupt: reject, prove no write, then approve and persist once.
  await page
    .getByRole("button", { name: "Review & save", exact: true })
    .click();
  await expect(page.getByTestId("approval-widget")).toBeVisible();
  await page.getByRole("button", { name: "Keep my budget" }).click();
  await expect(page.getByTestId("approval-widget")).toHaveCount(0);
  await expect(page.getByLabel("Message Penny")).toBeEnabled();
  expect(
    (await (await request.get(backend + "/api/budget")).json()).approvals,
  ).toBe(approvals);
  await page
    .getByRole("button", { name: "Review & save", exact: true })
    .click();
  await expect(page.getByTestId("approval-widget")).toBeVisible();
  await page.getByRole("button", { name: "Approve & save" }).click();
  await expect(page.getByTestId("approval-widget")).toHaveCount(0);
  await expect(page.getByLabel("Message Penny")).toBeEnabled();
  const saved = await (await request.get(backend + "/api/budget")).json();
  expect(saved.approvals).toBe(approvals + 1);
  expect(
    saved.income -
      saved.categories.reduce(
        (sum: number, row: { amount: number }) => sum + row.amount,
        0,
      ),
  ).toBeGreaterThanOrEqual(saved.goal);

  // In-app frontend tool pauses for a human, then ADK saves the selected goal.
  await page
    .getByRole("button", { name: "Change my goal", exact: true })
    .click();
  await expect(page.getByTestId("goal-picker")).toBeVisible();
  await page.locator("#agent-goal").fill("1500");
  await page.getByRole("button", { name: "Use this goal" }).click();
  await expect(page.getByLabel("Message Penny")).toBeEnabled();
  expect((await (await request.get(backend + "/api/budget")).json()).goal).toBe(
    150000,
  );

  await page
    .getByRole("button", { name: "Build a dashboard", exact: true })
    .click();
  await expect(
    page.locator(".workspace").getByTestId("generated-dashboard"),
  ).toBeVisible();
  await expect(page.getByLabel("Message Penny")).toBeEnabled();
  await expect(page.locator(".workspace .dashboard-section")).toHaveCount(3);

  // Open UI is real generated HTML, with a working input/output inside an isolated frame.
  await page
    .getByLabel("Message Penny")
    .fill(
      "Use render_html to create a working savings calculator: a labeled monthly contribution input, months input, and total saved output. Use inline JavaScript to update the total on input.",
    );
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.locator(".workspace").getByTestId("html-widget"),
  ).toBeVisible();
  await expect(page.getByLabel("Message Penny")).toBeEnabled();
  const frame = page.locator(".workspace iframe");
  await expect(frame).toHaveAttribute("sandbox", "allow-scripts");
  const content = frame.contentFrame();
  await expect(content.locator("input").first()).toBeVisible();
  const before = await content.locator("body").innerText();
  await content.locator("input").first().fill("333");
  await content.locator("input").first().dispatchEvent("input");
  await expect.poll(() => content.locator("body").innerText()).not.toBe(before);

  await page.getByRole("button", { name: "Open event inspector" }).click();
  await expect(
    page.getByRole("dialog").filter({ hasText: "The live event stream" }),
  ).toBeVisible();
  expect(await page.locator(".event-list .arg-event").count()).toBeGreaterThan(
    health.native_argument_streaming ? 10 : 0,
  );
  expect(errors).toEqual([]);
});

test("mobile navigation and feature guide stay keyboard accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Make room for what matters." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page
    .getByRole("navigation", { name: "Workspace sections" })
    .getByRole("button", { name: "Playground", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "An interface, just for you." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Explore all 9 capabilities" })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Demo capabilities" }),
  ).toBeVisible();
  await expect(page.locator(".feature-list button")).toHaveCount(9);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Demo capabilities" }),
  ).not.toBeVisible();
});
