import type { Page, Locator } from "@playwright/test";
import { API } from "../constants/api-routes";

export class GitSyncPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  get quickActionsCommitBtn(): Locator {
    return this.page.getByTestId("t--git-quick-actions-commit");
  }

  get opsModal(): Locator {
    return this.page.getByTestId("t--git-ops-modal");
  }

  get opsCommitBtn(): Locator {
    return this.page.getByTestId("t--git-commit-btn");
  }

  async importAppFromGit(repoUrl: string) {
    await this.page.getByRole("button", { name: /import from git/i }).click();
    await this.page.getByPlaceholder(/git repository url/i).fill(repoUrl);

    const responsePromise = this.page.waitForResponse(
      (r) => r.url().includes(API.gitImport) && r.ok(),
    );
    await this.page.getByRole("button", { name: /import/i }).click();
    return responsePromise;
  }

  async commitChanges() {
    await this.quickActionsCommitBtn.click();

    const commitResponse = this.page.waitForResponse(
      (r) => r.url().includes(API.gitCommit) && r.status() === 201,
    );
    await this.opsCommitBtn.click();
    await commitResponse;
  }

  async closeOpsModal() {
    await this.opsModal.getByRole("button", { name: /close/i }).click();
  }
}
