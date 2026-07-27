import { mkdirSync } from "node:fs";
import type { Page } from "@playwright/test";

export const SHOTS_DIR = "screenshots";

export function ensureShotsDir() {
  mkdirSync(SHOTS_DIR, { recursive: true });
}

// Sign in via the dev login (requires ENABLE_DEV_LOGIN=true).
export async function devLogin(
  page: Page,
  name = "Test User",
  email = "test@example.com",
) {
  await page.goto("/login");
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="email"]').fill(email);
  await page.getByTestId("dev-login-submit").click();
  await page.waitForURL("**/");
}
