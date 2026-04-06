import { test, expect } from "../../../fixtures";
import { loadMigrationState } from "../../../helpers/migration-state";
import { SELECTORS } from "../../../constants/selectors";
import { TableComponent } from "../../../page-objects/components/table.component";

test.describe("Migration v1.9.24 — Widget bindings (Widgets page)", () => {
  let appSlug: string;

  test.beforeAll(() => {
    const state = loadMigrationState();
    appSlug = state.appSlug;
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/app/${appSlug}/widgets-*`);
    await page.waitForLoadState("networkidle");
  });

  test("media and chart widgets are visible", async ({ page }) => {
    await expect(
      page.locator(SELECTORS.widgetInDeployed("audio")),
    ).toBeVisible();
    await expect(
      page.locator(SELECTORS.widgetInDeployed("audiorecorder")),
    ).toBeVisible();
    await expect(
      page.locator(SELECTORS.widgetInDeployed("document_viewer")),
    ).toBeVisible();
    await expect(
      page.locator(SELECTORS.widgetInDeployed("chart")),
    ).toBeVisible();
  });

  test("checkbox group shows astronaut names from DB binding", async ({
    page,
  }) => {
    const checkboxGroup = page.locator(
      SELECTORS.widgetInDeployed("checkboxgroup"),
    );
    await expect(checkboxGroup).toBeVisible();
    await expect(checkboxGroup).toContainText("Select Astronaut");
    await expect(checkboxGroup).toContainText("Ulf Merbold");
    await expect(checkboxGroup).toContainText("Andreas Mogensen");
    await expect(checkboxGroup).toContainText("Wubbo Ockels");
    await expect(checkboxGroup).toContainText("Thomas Reiter");
    await expect(checkboxGroup).toContainText("Anil Menon");

    const ulfCheckbox = page.locator(
      'input[type="checkbox"][value="Ulf Merbold"]',
    );
    await expect(ulfCheckbox).toBeChecked();

    const anilCheckbox = page.getByRole("checkbox", { name: "Anil Menon" });
    await anilCheckbox.check();
    await expect(anilCheckbox).toBeChecked();
  });

  test("slider interaction fires toast", async ({ page }) => {
    const slider = page.locator(SELECTORS.sliderThumb);
    await slider.scrollIntoViewIfNeeded();
    await slider.focus();
    await page.keyboard.press("ArrowRight");

    await expect(page.locator(SELECTORS.toast)).toContainText(
      "Category Value Changed!",
    );
  });

  test("currency input binding fires toast with JSON payload", async ({
    page,
  }) => {
    const currencyInput = page
      .locator(SELECTORS.widgetInDeployed("currencyinput"))
      .locator("input");
    await currencyInput.fill("10");

    await expect(page.locator(SELECTORS.toast)).toContainText("INR");
  });

  test("table filters by input widget value", async ({ page }) => {
    const searchInput = page
      .locator(SELECTORS.widgetInDeployed("inputwidgetv2"))
      .locator("input");
    await searchInput.fill("144");

    const table = new TableComponent(page);
    await table.waitUntilLoaded();
    await expect(table.cell(0, 3)).toContainText("Christina");
  });
});
