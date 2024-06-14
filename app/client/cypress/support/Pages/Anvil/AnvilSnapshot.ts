import { ObjectsRegistry } from "../../Objects/Registry";

export class AnvilSnapshot {
  private appSettings = ObjectsRegistry.AppSettings;
  private agHelper = ObjectsRegistry.AggregateHelper;
  private deployMode = ObjectsRegistry.DeployMode;


  private locators = {
    ...ObjectsRegistry.CommonLocators,
    canvas: "[data-testid=t--canvas-artboard]",
    colorMode: "[data-testid=t--anvil-theme-settings-color-mode]",
    appViewerPage: "[data-testid=t--app-viewer-page]",
  }

  public verifyCanvasMode = (widgetName: string) => {
    cy.get(this.locators.canvas).matchImageSnapshot(`anvil${widgetName}LightMode`);

    this.setTheme("dark");

    cy.get(this.locators.canvas).matchImageSnapshot(`anvil${widgetName}DarkMode`);

    this.setTheme("light");
  }

  public verifyPreviewMode = (widgetName: string) => {
    this.enterPreviewMode();

    cy.get(this.locators.canvas).matchImageSnapshot(`anvil${widgetName}PreviewMode`);

    this.exitPreviewMode();
  }

  public verifyDeployMode = (widgetName: string) => {
    this.deployMode.DeployApp(this.locators.appViewerPage);

    this.verifyForDifferentDevices(widgetName, ["macbook-13", "iphone-6", "ipad-2"]);
  }

  private verifyForDifferentDevices = (widgetName: string, devices: Cypress.ViewportPreset[]) => {
    devices.forEach(device => {
      cy.viewport(device);

      cy.get(this.locators.appViewerPage).matchImageSnapshot(`anvil${widgetName}${device}`);
    });
  }

  private enterPreviewMode = (shouldOpen = true) => {
    this.agHelper.GetNClick(this.locators._enterPreviewMode);
  }

  private exitPreviewMode = () => {
    this.agHelper.GetNClick(this.locators._exitPreviewMode);
  }

  private setTheme = (theme: "light" | "dark") => {
    this.appSettings.OpenAppSettings();
    this.appSettings.GoToThemeSettings();

    cy.get(`${this.locators.colorMode} [data-value=${theme.toUpperCase()}]`).click();
  }
}