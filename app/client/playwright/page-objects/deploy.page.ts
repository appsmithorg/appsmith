import type { Page, Locator } from "@playwright/test";
import { SELECTORS } from "../constants/selectors";

export class DeployPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async openDeployPreview() {
    await this.page.getByTestId("t--top-bar-deploy-btn").click();
    await this.page.waitForURL((url) => url.pathname.includes("/app/"));
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
    const field = this.page
      .getByText(label)
      .locator("..")
      .locator("input, textarea")
      .first();
    await field.clear();
    await field.fill(value);
  }

  clickButton(name: string, nth = 0): Locator {
    return this.page.getByRole("button", { name }).nth(nth);
  }

  get modal(): Locator {
    return this.page.locator(SELECTORS.modal);
  }
}
