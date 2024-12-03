export class PluginEditorToolbar {
  private dropdownTrigger: string | undefined;
  private runButton: string;
  private settingsButton: string;
  private contextMenuTrigger: string;

  constructor(
    runButton: string,
    settingsButton: string,
    contextMenuTrigger: string,
    dropdownTrigger?: string,
  ) {
    this.dropdownTrigger = dropdownTrigger;
    this.runButton = runButton;
    this.settingsButton = settingsButton;
    this.contextMenuTrigger = contextMenuTrigger;
  }

  public openDropdownTrigger() {
    if (!this.dropdownTrigger) {
      throw new Error("Dropdown trigger not defined");
    }

    cy.get(this.dropdownTrigger).click({ force: true });
  }

  public clickRunButton() {
    cy.get(this.runButton).click({ force: true });
  }

  public toggleSettings() {
    cy.get(this.settingsButton).click({ force: true });
  }

  public openContextMenu() {
    cy.get(this.contextMenuTrigger).click({ force: true });
  }
}
