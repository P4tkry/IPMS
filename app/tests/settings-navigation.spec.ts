import { test, expect } from "@playwright/test";
import { mockSession, mockSettings } from "./helpers";

test("settings index redirects to account", async ({ page }) => {
  await mockSession(page, {
    id: "u-1",
    email: "admin@example.com",
    name: "Admin User",
  });
  await mockSettings(page, { permissions: [] });

  await page.goto("/settings");
  await page.waitForURL("**/settings/account");
});

test("settings users redirects when lacking permissions", async ({ page }) => {
  await mockSession(page, {
    id: "u-1",
    email: "admin@example.com",
    name: "Admin User",
  });
  await mockSettings(page, { permissions: [] });

  await page.goto("/settings/users");
  await page.waitForURL("**/settings/account");
});
