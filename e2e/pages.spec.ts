import { test, expect } from "@playwright/test";
import { SHOTS_DIR, devLogin, ensureShotsDir } from "./helpers";

// The first dev-login user becomes OWNER + ADMIN, so these admin pages render.
test.beforeAll(() => ensureShotsDir());
test.beforeEach(async ({ page }) => {
  await devLogin(page);
});

test("billing page", async ({ page }) => {
  await page.goto("/billing");
  await expect(
    page.getByRole("heading", { name: "Betalinger og avtaler" }),
  ).toBeVisible();
  await expect(page.locator('a[aria-current="page"]')).toHaveText("Min side");
  await expect(page.getByText("Vipps-nøkler mangler.")).toBeVisible();
  await expect(page.getByText("Du har ingen aktive avtaler.")).toBeVisible();
  await expect(page.getByText("Ingen betalinger ennå.")).toBeVisible();
  // Without Vipps keys the page shows the "activate" notice — still a good shot.
  await page.screenshot({ path: `${SHOTS_DIR}/04-billing.png`, fullPage: true });
});

test("billing admin console", async ({ page }) => {
  await page.goto("/billing/admin");
  await expect(
    page.getByRole("heading", { name: "Vipps driftssentral" }),
  ).toBeVisible();
  await expect(page.locator('a[aria-current="page"]')).toHaveText(
    "Driftssentral",
  );
  await expect(page.getByRole("button", { name: "Betalinger" })).toBeVisible();
  await page.getByRole("button", { name: "Avstemming" }).click();
  await expect(
    page.getByRole("heading", { name: "Avstem penger og gebyrer" }),
  ).toBeVisible();
  await page.screenshot({
    path: `${SHOTS_DIR}/07-billing-admin.png`,
    fullPage: true,
  });
});

test("settings page", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByTestId("settings-page")).toBeVisible();
  await expect(page.getByText("Organisasjon", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `${SHOTS_DIR}/05-settings.png`,
    fullPage: true,
  });
});

test("profile page with sign out", async ({ page }) => {
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: /^(Profile|Profil)$/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^(Sign out|Logg ut)$/ }),
  ).toBeVisible();
  await page.screenshot({ path: `${SHOTS_DIR}/06-profile.png`, fullPage: true });
});
