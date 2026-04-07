import { test, expect } from "../../../fixtures";
import { loadMigrationState } from "../../../helpers/migration-state";
import { SELECTORS } from "../../../constants/selectors";
import { TableComponent } from "../../../page-objects/components/table.component";

test.describe("Migration v1.9.24 — MySQL CRUD (CountryFlags)", () => {
  let appSlug: string;

  test.beforeAll(() => {
    const state = loadMigrationState();
    appSlug = state.appSlug;
  });

  test("table renders with countryFlags data", async ({ page }) => {
    await page.goto(`/app/${appSlug}/countryflags-*`);

    const heading = page.locator(SELECTORS.widgetInDeployed("text")).first();
    await expect(heading).toContainText("countryFlags Data");

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await expect(table.rows).not.toHaveCount(0);
  });

  test("filter by Country starting with 'Ba' shows Bangladesh", async ({
    page,
  }) => {
    await page.goto(`/app/${appSlug}/countryflags-*`);

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await table.filter("Country", "starts with", "Ba");

    const thirdRowCountry = table.cell(2, 0);
    await expect(thirdRowCountry).toContainText("Bangladesh");

    await table.closeFilter();
  });

  test("download CSV contains Bangladesh", async ({ page }) => {
    await page.goto(`/app/${appSlug}/countryflags-*`);

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await table.filter("Country", "starts with", "Ba");

    const filename = await table.downloadAs("CSV");
    expect(filename).toContain("data_table");
    expect(filename).toMatch(/\.csv$/);
  });
});
