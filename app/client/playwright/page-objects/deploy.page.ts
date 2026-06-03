import type { Page, Locator } from "@playwright/test";
import { SELECTORS } from "../constants/selectors";

// JSON form debounces formData updates by 200ms (Form.tsx DEBOUNCE_TIMEOUT).
// Without this wait, submit actions read stale widget meta values.
const JSON_FORM_DEBOUNCE_MS = 250;

export class DeployPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async publish() {
    await this.page.locator(".t--application-publish-btn").click();
  }

  async navigateToDeployUrl(appSlug: string, pageSlug: string) {
    await this.page.goto(`/app/${appSlug}/${pageSlug}`);
    await this.page
      .locator(SELECTORS.deployedPage)
      .waitFor({ state: "visible" });
  }

  get headerText(): Locator {
    return this.page.locator(".t--widget-textwidget").first();
  }

  async navigateToPage(pageName: string) {
    await this.page
      .locator(SELECTORS.deployedPage)
      .getByText(pageName, { exact: false })
      .click();
  }

  async fillJsonInput(label: string, value: string) {
    const field = this.page.locator(SELECTORS.jsonFormInput(label));
    await field.fill(value);
    await this.page.waitForTimeout(JSON_FORM_DEBOUNCE_MS);
  }

  button(name: string, nth = 0): Locator {
    return this.page.getByRole("button", { name }).nth(nth);
  }

  get modal(): Locator {
    return this.page.locator(SELECTORS.modal);
  }
}
