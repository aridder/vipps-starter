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
  await page.getByPlaceholder("Name").fill(name);
  await page.getByPlaceholder("Email").fill(email);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/");
}
