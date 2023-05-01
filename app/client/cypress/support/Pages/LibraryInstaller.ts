import { ObjectsRegistry } from "../Objects/Registry";

export class LibraryInstaller {
  private _aggregateHelper = ObjectsRegistry.AggregateHelper;
  private _installer_trigger_locator = ".t--entity-add-btn.group.libraries";
  private _installer_close_locator = ".t--close-installer";

  private getLibraryLocatorInExplorer(libraryName: string) {
    return `.t--installed-library-${libraryName}`;
  }

  private getLibraryCardLocator(libraryName: string) {
    return `div.library-card.t--${libraryName}`;
  }

  public openInstaller() {
    this._aggregateHelper.GetNClick(this._installer_trigger_locator);
  }

  public closeInstaller() {
    this._aggregateHelper.GetNClick(this._installer_close_locator);
  }

  public installLibrary(
    libraryName: string,
    accessor: string,
    checkIfSuccessful = true,
  ) {
    cy.get(this.getLibraryCardLocator(libraryName))
      .find(".t--download")
      .click();
    if (checkIfSuccessful) this.assertInstall(libraryName, accessor);
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
    this._aggregateHelper.AssertContains(
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
