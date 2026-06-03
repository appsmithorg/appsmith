import type { Page, Locator } from "@playwright/test";
import { SELECTORS } from "../../constants/selectors";

// Must exceed the lodash debounce(onChange, 400) in RenderInput
// (CascadeFields.tsx) so the filter value propagates before APPLY is clicked.
const FILTER_INPUT_DEBOUNCE_MS = 500;

export class TableComponent {
  readonly page: Page;
  readonly container: Locator;

  constructor(page: Page, name = "data_table") {
    this.page = page;
    this.container = page.locator(SELECTORS.widgetByName(name));
  }

  get rows(): Locator {
    return this.container.locator(".tbody .tr");
  }

  cell(row: number, col: number): Locator {
    return this.container.locator(SELECTORS.tableCell(row, col));
  }

  async waitUntilLoaded() {
    await this.container.waitFor({ state: "visible" });
    await this.rows.first().waitFor({ state: "visible" });
  }

  async filter(column: string, condition: string, value: string) {
    await this.container.locator(".t--table-filter-toggle-btn").click();

    await this.page.locator(".t--table-filter-columns-dropdown").click();
    await this.page
      .locator(".t--dropdown-option")
      .filter({
        has: this.page.locator(".title", {
          hasText: new RegExp(`^${column}$`),
        }),
      })
      .click();

    await this.page.locator(".t--table-filter-conditions-dropdown").click();
    await this.page
      .locator(".t--dropdown-option")
      .filter({ hasText: condition })
      .click();

    await this.page.locator(".t--table-filter-value-input input").fill(value);

    // RenderInput (CascadeFields.tsx) debounces onChange by 400ms before
    // propagating the value to filter state. Without this wait, APPLY
    // reads stale (empty) state and the filter matches incorrectly.
    // See: widgets/TableWidgetV2/component/header/actions/filter/CascadeFields.tsx
    await this.page.waitForTimeout(FILTER_INPUT_DEBOUNCE_MS);

    await this.page.locator(".t--apply-filter-btn").click();

    await this.waitUntilLoaded();
  }

  async removeFilter() {
    await this.page.locator(".t--table-filter-remove-btn").first().click();
    await this.waitUntilLoaded();
  }

  async closeFilter() {
    await this.page.locator(".t--close-filter-btn").click();
  }

  async downloadAs(format: string): Promise<string> {
    const downloadPromise = this.page.waitForEvent("download");
    await this.container.locator(".t--table-download-btn").click();
    await this.page
      .locator(".t--table-download-data-option")
      .filter({ hasText: new RegExp(format, "i") })
      .click();
    const download = await downloadPromise;
    return download.suggestedFilename();
  }
}
