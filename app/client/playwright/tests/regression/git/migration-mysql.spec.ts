import { test, expect } from "../../../fixtures";
import { loadMigrationState, getPage } from "../../../helpers/migration-state";
import type { MigrationPage } from "../../../fixtures/migration.setup";
import { viewUrl } from "../../../helpers/url";
import { SELECTORS } from "../../../constants/selectors";
import { TableComponent } from "../../../page-objects/components/table.component";

test.describe("Migration v1.9.24 — MySQL CRUD (CountryFlags)", () => {
  let appSlug: string;
  let branchName: string;
  let countryFlagsPage: MigrationPage;

  test.beforeAll(() => {
    const state = loadMigrationState();
    appSlug = state.appSlug;
    branchName = state.branchName;
    countryFlagsPage = getPage(state, "countryflags");
  });

  test("table renders with countryFlags data", async ({ page }) => {
    await page.goto(
      viewUrl({
        pageId: countryFlagsPage.baseId,
        pageSlug: countryFlagsPage.slug,
        appSlug,
        branch: branchName,
      }),
    );

    const heading = page
      .locator(SELECTORS.widgetInDeployed("textwidget"))
      .first();
    await expect(heading).toContainText("countryFlags Data");

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await expect(table.rows).not.toHaveCount(0);
  });

  test("filter by Country starting with 'Ba' shows Bangladesh", async ({
    page,
  }) => {
    await page.goto(
      viewUrl({
        pageId: countryFlagsPage.baseId,
        pageSlug: countryFlagsPage.slug,
        appSlug,
        branch: branchName,
      }),
    );

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await table.filter("Country", "starts with", "Ba");

    const thirdRowCountry = table.cell(2, 0);
    await expect(thirdRowCountry).toContainText("Bangladesh");

    await table.closeFilter();
  });

  test("download CSV contains Bangladesh", async ({ page }) => {
    await page.goto(
      viewUrl({
        pageId: countryFlagsPage.baseId,
        pageSlug: countryFlagsPage.slug,
        appSlug,
        branch: branchName,
      }),
    );

    const table = new TableComponent(page, "data_table");
    await table.waitUntilLoaded();
    await table.filter("Country", "starts with", "Ba");

    const filename = await table.downloadAs("CSV");
    expect(filename).toContain("data_table");
    expect(filename).toMatch(/\.csv$/);
  });
});
