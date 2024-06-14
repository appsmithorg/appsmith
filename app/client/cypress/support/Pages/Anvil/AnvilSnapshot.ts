import { ObjectsRegistry } from "../../Objects/Registry";

export class AnvilSnapshot {
  private appSettings = ObjectsRegistry.AppSettings;
  private agHelper = ObjectsRegistry.AggregateHelper;
  private deployMode = ObjectsRegistry.DeployMode;


  private locators = {
    ...ObjectsRegistry.CommonLocators,
    canvas: "[data-testid=t--canvas-artboard]",
    colorMode: "[data-testid=t--anvil-theme-settings-color-mode]",
  }

  public verifyCanvasMode = (widgetName: string) => {
    cy.get(this.locators.canvas).matchImageSnapshot(`anvil${widgetName}LightMode`);

    this.setTheme("dark");

    cy.get(this.locators.canvas).matchImageSnapshot(`anvil${widgetName}DarkMode`);
  }

  public verifyPreviewMode = (widgetName: string) => {
    this.openPreviewMode();

    cy.get(this.locators.canvas).matchImageSnapshot(`anvil${widgetName}PreviewMode`);
  }

  public verifyDeployMode = (widgetName: string) => {
    this.deployMode.DeployApp();

    this.verifyForDifferentDevices(widgetName, ["ipad-2", "iphone-6", "macbook-13"]);
  }

  private verifyForDifferentDevices = (widgetName: string, devices: Cypress.ViewportPreset[]) => {
    devices.forEach(device => {
      cy.viewport(device);

      cy.get(this.locators.canvas).matchImageSnapshot(`anvil${widgetName}${device}`);
    });
  }

  private openPreviewMode = () => {
    this.agHelper.GetNClick(this.locators._enterPreviewMode);
  }

  private setTheme = (theme: "light" | "dark") => {
    this.appSettings.OpenAppSettings();
    this.appSettings.GoToThemeSettings();

    cy.get(`${this.locators.colorMode} [data-value=${theme.toUpperCase()}]`).click();
  }
}