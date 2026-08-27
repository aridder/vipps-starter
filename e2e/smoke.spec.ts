import { test, expect } from "@playwright/test";
import { SHOTS_DIR, devLogin, ensureShotsDir } from "./helpers";

test.beforeAll(() => ensureShotsDir());

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("real-payment-notice")).toContainText(
    "Ekte betalingsflyt – ingen kan trekkes akkurat nå",
  );
  await expect(page.getByTestId("real-payment-notice")).toContainText(
    "Alle donasjoner mottas med stor takk",
  );
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Hele Vipps-reisen. Ferdig bygget.",
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Jeg er administrator" }).click();
  await expect(
    page.getByRole("heading", { name: "Fra innbetaling til avstemming" }),
  ).toBeVisible();
  await page.screenshot({ path: `${SHOTS_DIR}/01-landing.png`, fullPage: true });
});

test("terms and privacy pages are public", async ({ page }) => {
  await page.goto("/vilkar");
  await expect(
    page.getByRole("heading", { level: 1, name: "Brukervilkår" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "personvernerklæringen" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Personvernerklæring" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "brukervilkårene" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Brukervilkår" }),
  ).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: "Personvern" }),
  ).toBeVisible();
  await page.screenshot({ path: `${SHOTS_DIR}/08-vilkar.png`, fullPage: true });
});

test("dev login works", async ({ page }) => {
  await devLogin(page);
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: /^(Profile|Profil)$/ }),
  ).toBeVisible();
  await page.screenshot({
    path: `${SHOTS_DIR}/02-profile.png`,
    fullPage: true,
  });
});
