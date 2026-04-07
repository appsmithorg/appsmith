import type { Page, Locator } from "@playwright/test";
import { ROUTES } from "../constants/routes";

export class HomePage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto(ROUTES.applications);
  }

  get newWorkspaceButton(): Locator {
    return this.page.getByRole("button", { name: /new workspace/i });
  }

  async createWorkspace(name: string) {
    await this.newWorkspaceButton.click();
    await this.page.getByPlaceholder(/workspace name/i).fill(name);
    await this.page.getByRole("button", { name: /submit/i }).click();
  }

  async renameApplication(newName: string) {
    const appNameInput = this.page.getByTestId("t--application-name");
    await appNameInput.dblclick();
    const input = appNameInput.locator("input");
    await input.fill(newName);
    await input.press("Enter");
  }

  async deleteApplication(name: string) {
    const appCard = this.page.getByText(name).first();
    await appCard.hover();
    await this.page.getByRole("button", { name: /more/i }).first().click();
    await this.page.getByRole("menuitem", { name: /delete/i }).click();
    await this.page.getByRole("button", { name: /are you sure/i }).click();
  }

  async deleteWorkspace(name: string) {
    const workspaceSection = this.page.getByText(name).first();
    await workspaceSection.hover();
    await this.page
      .getByRole("button", { name: /workspace settings/i })
      .first()
      .click();
    await this.page.getByRole("button", { name: /delete workspace/i }).click();
    await this.page.getByRole("button", { name: /are you sure/i }).click();
  }

  applicationCard(name: string): Locator {
    return this.page.getByText(name).first();
  }
}
