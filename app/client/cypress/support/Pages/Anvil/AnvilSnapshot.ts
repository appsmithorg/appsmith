import { agHelper } from "../../Objects/ObjectsCore";
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
    appViewerPage: "[data-testid=t--app-viewer-page]",
    propertyPaneSidebar: "[data-testid=t--property-pane-sidebar]",
  };

  public verifyCanvasMode = async (widgetName: string) => {
    this.agHelper
      .GetElement(this.locators.canvas)
      .matchImageSnapshot(`anvil${widgetName}Canvas`, {
        comparisonMethod: "ssim",
      });

    this.setTheme("dark");

    this.agHelper
      .GetElement(this.locators.canvas)
      .matchImageSnapshot(`anvil${widgetName}CanvasDark`, {
        comparisonMethod: "ssim",
      });

    this.setTheme("light");
  };

  public verifyPreviewMode = (widgetName: string) => {
    this.enterPreviewMode();

    this.agHelper.GetNClick(this.locators.canvas);

    this.agHelper
      .GetElement(this.locators.canvas)
      .matchImageSnapshot(`anvil${widgetName}Preview`, {
        comparisonMethod: "ssim",
      });

    this.exitPreviewMode();
  };

  public verifyDeployMode = (widgetName: string) => {
    this.deployMode.DeployApp(this.locators.appViewerPage);

    cy.viewport("macbook-13");
    this.agHelper
      .GetElement(this.locators.appViewerPage)
      .matchImageSnapshot(`anvil${widgetName}DeployMacbook`, {
        comparisonMethod: "ssim",
      });

    cy.viewport("iphone-6");
    this.agHelper
      .GetElement(this.locators.appViewerPage)
      .matchImageSnapshot(`anvil${widgetName}DeployIphone`, {
        comparisonMethod: "ssim",
      });

    cy.viewport("ipad-2");
    this.agHelper
      .GetElement(this.locators.appViewerPage)
      .matchImageSnapshot(`anvil${widgetName}DeployIpad`, {
        comparisonMethod: "ssim",
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
}
