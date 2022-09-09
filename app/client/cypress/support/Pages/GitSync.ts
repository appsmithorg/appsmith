import { ObjectsRegistry } from "../Objects/Registry";

export class GitSync {
  public agHelper = ObjectsRegistry.AggregateHelper;
  public locator = ObjectsRegistry.CommonLocators;

  private _connectGitBottomBar = ".t--connect-git-bottom-bar";
  private _gitSyncModal = ".git-sync-modal";
  private _closeGitSyncModal = ".t--close-git-sync-modal";

  openGitSyncModal() {
    cy.get(this._connectGitBottomBar).click();
    cy.get(this._gitSyncModal).should("be.visible");
  }

  closeGitSyncModal() {
    cy.get(this._closeGitSyncModal).click();
    cy.get(this._gitSyncModal).should("not.exist");
  }
}
