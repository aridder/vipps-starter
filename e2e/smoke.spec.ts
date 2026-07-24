import { test, expect } from "@playwright/test";
import { SHOTS_DIR, devLogin, ensureShotsDir } from "./helpers";

test.beforeAll(() => ensureShotsDir());

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.screenshot({ path: `${SHOTS_DIR}/01-landing.png`, fullPage: true });
});

test("dev login works", async ({ page }) => {
  await devLogin(page);
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await page.screenshot({
    path: `${SHOTS_DIR}/02-profile.png`,
    fullPage: true,
  });
});
