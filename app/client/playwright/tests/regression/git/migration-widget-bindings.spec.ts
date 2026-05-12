import { test, expect } from "../../../fixtures";
import { loadMigrationState, getPage } from "../../../helpers/migration-state";
import type { MigrationPage } from "../../../fixtures/migration.setup";
import { viewUrl } from "../../../helpers/url";
import { SELECTORS } from "../../../constants/selectors";
import { TableComponent } from "../../../page-objects/components/table.component";

test.describe("Migration v1.9.24 — Widget bindings (Widgets page)", () => {
  let appSlug: string;
  let branchName: string;
  let widgetsPage: MigrationPage;

  test.beforeAll(() => {
    const state = loadMigrationState();
    appSlug = state.appSlug;
    branchName = state.branchName;
    widgetsPage = getPage(state, "widgets");
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(
      viewUrl({
        pageId: widgetsPage.baseId,
        pageSlug: widgetsPage.slug,
        appSlug,
        branch: branchName,
      }),
    );
    await expect(
      page.locator(SELECTORS.widgetInDeployed("checkboxgroupwidget")),
    ).toBeVisible();
  });

  test("media and chart widgets are visible", async ({ page }) => {
    await expect(
      page.locator(SELECTORS.widgetInDeployed("audiowidget")),
    ).toBeVisible();
    await expect(
      page.locator(SELECTORS.widgetInDeployed("audiorecorderwidget")),
    ).toBeVisible();
    await expect(
      page.locator(SELECTORS.widgetInDeployed("documentviewerwidget")),
    ).toBeVisible();
    await expect(
      page.locator(SELECTORS.widgetInDeployed("chartwidget")),
    ).toBeVisible();
  });

  test("checkbox group shows astronaut names from DB binding", async ({
    page,
  }) => {
    const checkboxGroup = page.locator(
      SELECTORS.widgetInDeployed("checkboxgroupwidget"),
    );
    await expect(checkboxGroup).toBeVisible();
    await expect(checkboxGroup).toContainText("Select Astronaut");
    await expect(checkboxGroup).toContainText("Ulf Merbold");
    await expect(checkboxGroup).toContainText("Andreas Mogensen");
    await expect(checkboxGroup).toContainText("Wubbo Ockels");
    await expect(checkboxGroup).toContainText("Thomas Reiter");
    await expect(checkboxGroup).toContainText("Anil Menon");

    const ulfCheckbox = page.getByRole("checkbox", { name: "Ulf Merbold" });
    await expect(ulfCheckbox).toBeChecked();

    await checkboxGroup.getByText("Anil Menon").click();
    await expect(
      page.getByRole("checkbox", { name: "Anil Menon" }),
    ).toBeChecked();
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
      .locator(SELECTORS.widgetInDeployed("currencyinputwidget"))
      .locator("input");
    await currencyInput.fill("10");

    await expect(page.locator(SELECTORS.toast)).toContainText("INR");
  });

  test("table filters by input widget value", async ({ page }) => {
    const searchInput = page
      .locator(SELECTORS.widgetInDeployed("inputwidgetv2"))
      .locator("input");
    await searchInput.fill("144");

    const table = new TableComponent(page, "Table1");
    await table.waitUntilLoaded();
    await expect(table.cell(0, 3)).toContainText("Christina");
  });
});
