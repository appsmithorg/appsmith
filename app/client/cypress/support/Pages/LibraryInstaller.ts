import { ObjectsRegistry } from "../Objects/Registry";

export class LibraryInstaller {
  private _aggregateHelper = ObjectsRegistry.AggregateHelper;
  private _installer_trigger_locator = ".t--install-library-button";
  private _installer_close_locator =
    ".ads-v2-popover__body-header .ads-v2-icon";

  private getLibraryLocatorInExplorer(libraryName: string) {
    return `.t--installed-library-${libraryName}`;
  }

  private getLibraryCardLocator(libraryName: string) {
    return `div.library-card.t--${libraryName}`;
  }

  private libraryURLLocator = "[data-testid='library-url']";
  private installBtnLocator = "[data-testid='install-library-btn']";

  public OpenInstaller(force = false) {
    this._aggregateHelper.GetNClick(this._installer_trigger_locator, 0, force);
  }

  public CloseInstaller() {
    this._aggregateHelper.GetNClick(this._installer_close_locator);
  }

  public InstallLibrary(
    libraryName: string,
    accessor: string,
    checkIfSuccessful = true,
  ) {
    cy.get(this.getLibraryCardLocator(libraryName))
      .find(".t--download")
      .click();
    if (checkIfSuccessful) this.assertInstall(libraryName, accessor);
  }

  public InstallLibraryViaURL(
    url: string,
    accessor: string,
    checkIfSuccessful = true,
  ) {
    this._aggregateHelper.TypeText(this.libraryURLLocator, url);
    this._aggregateHelper.GetNClick(this.installBtnLocator);
    if (checkIfSuccessful) {
      this._aggregateHelper.AssertContains(
        `Installation Successful. You can access the library via ${accessor}`,
      );
    }
  }

  private assertInstall(libraryName: string, accessor: string) {
    this._aggregateHelper.AssertContains(
      `Installation Successful. You can access the library via ${accessor}`,
    );
    cy.get(this.getLibraryCardLocator(libraryName))
      .find(".installed")
      .should("be.visible");
    this._aggregateHelper.AssertElementExist(
      this.getLibraryLocatorInExplorer(libraryName),
    );
  }

  public uninstallLibrary(libraryName: string) {
    cy.get(this.getLibraryLocatorInExplorer(libraryName))
      .realHover()
      .find(".t--uninstall-library")
      .click();
  }

  public assertUnInstall(libraryName: string) {
    this._aggregateHelper.WaitUntilToastDisappear(
      `${libraryName} is uninstalled successfully.`,
    );
    this._aggregateHelper.AssertElementAbsence(
      this.getLibraryLocatorInExplorer(libraryName),
    );
  }

  public AssertLibraryinExplorer(libraryName: string) {
    this._aggregateHelper.AssertElementExist(
      this.getLibraryLocatorInExplorer(libraryName),
    );
  }
}
