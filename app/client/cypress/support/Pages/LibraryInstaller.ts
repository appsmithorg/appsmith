import { ObjectsRegistry } from "../Objects/Registry";

export class LibraryInstaller {
  private _aggregateHelper = ObjectsRegistry.AggregateHelper;
  private _installer_trigger_locator = ".t--entity-add-btn.group.libraries";
  private _installer_close_locator = ".";

  private getLibraryLocatorInExplorer(libraryName: string) {}

  private getLibraryInstallButtonLocator(libraryName: string) {
    return `div.library-card.t--${libraryName}.t--download`;
  }

  public openInstaller() {
    this._aggregateHelper.GetNClick(this._installer_trigger_locator);
  }

  public closeInstaller() {
    this._aggregateHelper.GetNClick(this._installer_close_locator);
  }

  public installLibrary(libraryName: string) {
    this._aggregateHelper.GetNClick(
      this.getLibraryInstallButtonLocator(libraryName),
    );
  }

  public assertInstallation(libraryName: string) {
    cy.get(this.getLibraryInstallButtonLocator(libraryName)).should(
      "have.class",
      "installed",
    );
  }

  public uninstallLibrary(libraryName: string) {
    this._aggregateHelper.GetNClick(
      this.getLibraryInstallButtonLocator(libraryName),
    );
  }
}
