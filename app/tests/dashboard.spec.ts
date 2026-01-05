import { test, expect } from "@playwright/test";
import { mockSession } from "./helpers";

test("dashboard redirects when unauthenticated", async ({ page }) => {
  await mockSession(page);

  await page.goto("/dashboard");
  await page.waitForURL("**/login");
});

test("dashboard shows session data", async ({ page }) => {
  await mockSession(page, {
    id: "u-1",
    email: "admin@example.com",
    name: "Admin User",
    emailVerified: true,
  });

  await page.goto("/dashboard");

  await expect(page.getByText("Email: admin@example.com")).toBeVisible();
  await expect(page.getByText("Id: u-1")).toBeVisible();
  await expect(page.getByText("Imie: Admin User")).toBeVisible();
});
