import { test, expect } from "@playwright/test";

test("landing page renders hero content", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Launching in Q1 2026")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Inteligent Project Management Software" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Request demo" })).toBeVisible();
  await expect(page.getByRole("button", { name: "View roadmap" })).toBeVisible();
});
