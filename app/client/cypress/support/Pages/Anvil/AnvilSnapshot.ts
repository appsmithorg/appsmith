import { ObjectsRegistry } from "../../Objects/Registry";

export class AnvilSnapshot {
  private appSettings = ObjectsRegistry.AppSettings;
  private agHelper = ObjectsRegistry.AggregateHelper;
  private deployMode = ObjectsRegistry.DeployMode;
  private locators = {
    enterPreviewMode: ObjectsRegistry.CommonLocators._enterPreviewMode,
    exitPreviewMode: ObjectsRegistry.CommonLocators._exitPreviewMode,
    canvas: "[data-testid=t--canvas-artboard]",
    colorMode: "[data-testid=t--anvil-theme-settings-color-mode]",
    appViewerPage: "[data-testid=t--app-viewer-page-body]",
    propertyPaneSidebar: "[data-testid=t--property-pane-sidebar]",
  };

  public verifyCanvasMode = async (widgetName: string) => {
    this.agHelper
      .GetElement(this.locators.canvas)
      .matchImageSnapshot(`anvil${widgetName}Canvas`);

    this.setTheme("dark");

    this.agHelper
      .GetElement(this.locators.canvas)
      .matchImageSnapshot(`anvil${widgetName}CanvasDark`);

    this.setTheme("light");
  };

  public verifyPreviewMode = (widgetName: string) => {
    this.enterPreviewMode();

    this.agHelper.GetNClick(this.locators.canvas);

    this.agHelper
      .GetElement(this.locators.canvas)
      .matchImageSnapshot(`anvil${widgetName}Preview`);

    this.exitPreviewMode();
  };

  public verifyDeployMode = (widgetName: string) => {
    this.deployMode.DeployApp(this.locators.appViewerPage);

    this.verifyForDifferentDevices(widgetName, [
      "macbook-13",
      "iphone-6",
      "ipad-2",
    ]);
  };

  private verifyForDifferentDevices = (
    widgetName: string,
    devices: Cypress.ViewportPreset[],
  ) => {
    devices.forEach((device) => {
      cy.viewport(device);

      this.agHelper
        .GetElement(this.locators.appViewerPage)
        .matchImageSnapshot(`anvil${widgetName}Deploy${device}`, {
          capture: "fullPage",
        });
    });
  };

  private enterPreviewMode = (shouldOpen = true) => {
    this.agHelper.GetNClick(this.locators.enterPreviewMode);
  };

  private exitPreviewMode = () => {
    this.agHelper.GetNClick(this.locators.exitPreviewMode);
  };

  private setTheme = (theme: "light" | "dark") => {
    this.appSettings.OpenAppSettings();
    this.appSettings.GoToThemeSettings();

    this.agHelper.GetNClick(
      `${this.locators.colorMode} [data-value=${theme.toUpperCase()}]`,
    );

    this.appSettings.ClosePane();
  };

  public triggerInputInvalidState = () => {
    this.enterPreviewMode();
    cy.get("input[aria-required=true]").first().type("123");
    cy.get("input[aria-required=true]").first().clear();
    this.exitPreviewMode();
    this.agHelper.GetNClick(this.locators.propertyPaneSidebar);
  };

  public triggerCheckboxGroupInvalidState = () => {
    this.enterPreviewMode();
    cy.get(
      "[data-widget-name*='CheckboxGroup'] div:has([aria-label='(required)']) div:has(input[type=checkbox]) label",
    )
      .first()
      .click();
    cy.get(
      "[data-widget-name*='CheckboxGroup'] div:has([aria-label='(required)']) div:has(input[type=checkbox]) label",
    )
      .first()
      .click();
    this.exitPreviewMode();
    this.agHelper.GetNClick(this.locators.propertyPaneSidebar);
  };
}
