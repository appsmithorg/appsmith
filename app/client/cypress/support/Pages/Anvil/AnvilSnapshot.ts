import { camelCase } from "lodash";
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
    fontFamilySectionInput: "[data-testid=t--anvil-theme-settings-typography] input",
  };

  public verifyCanvasMode = async (widgetName: string) => {
    this.matchSnapshot(this.locators.canvas, `anvil${widgetName}Canvas`);

    this.setTheme("dark");

    this.agHelper
      .GetElement(this.locators.canvas)
      .matchImageSnapshot(`anvil${widgetName}CanvasDark`, {
        comparisonMethod: "ssim",
      });

    this.setTheme("light");
  };

  public matchSnapshot(locator: string, name: string, mode: "canvas" | "preview" | "deploy" = "canvas", theme: "light" | "dark" = "light") {
    const snapshotName = camelCase(`anvil_${name}$_${mode}${theme == "dark" ? "_dark" : ""}`);

    this.agHelper.GetElement(locator).matchImageSnapshot(snapshotName, {
      comparisonMethod: "ssim",
    });
  }

  public matchSanpshotForCanvasMode = (name: string, theme: Parameters<typeof this.matchSnapshot>[3] = "light") => {
    this.matchSnapshot(this.locators.canvas, name, "canvas", theme);
  }

  public matchSnapshotForPreviewMode = (name: string, theme: Parameters<typeof this.matchSnapshot>[3] = "light") => {
    this.enterPreviewMode();

    this.matchSnapshot(this.locators.canvas, name, "preview", theme);

    this.exitPreviewMode();
  };

  public matchSnapshotForDeployMode = (name: string, theme: Parameters<typeof this.matchSnapshot>[3] = "light") => {
    this.deployMode.DeployApp(this.locators.appViewerPage);

    this.matchSnapshot(this.locators.canvas, name, "deploy", theme);

    this.agHelper.BrowserNavigation(-1);
  }


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
          comparisonMethod: "ssim",
        });
    });
  };

  public enterPreviewMode = (shouldOpen = true) => {
    this.agHelper.GetNClick(this.locators.enterPreviewMode);
    this.agHelper.GetNClick(this.locators.canvas);
  };

  private exitPreviewMode = () => {
    this.agHelper.GetNClick(this.locators.exitPreviewMode);
    this.agHelper.GetNClick(this.locators.canvas);
  };

  public setTheme = (theme: "light" | "dark") => {
    this.appSettings.OpenAppSettings();
    this.appSettings.GoToThemeSettings();

    this.agHelper.GetNClick(
      `${this.locators.colorMode} [data-value=${theme.toUpperCase()}]`,
    );

    this.appSettings.ClosePane();
  };

  public setTypography = (name: string) => {
    this.appSettings.OpenAppSettings();
    this.appSettings.GoToThemeSettings();

    cy.get(this.locators.fontFamilySectionInput).click({ force: true })

    cy.get(".rc-virtual-list .rc-select-item-option")
      .find(".leading-normal")
      .contains(name)
      .click({ force: true })

    cy.contains("Typography").click({ force: true });

    this.appSettings.ClosePane();
  }

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

  public getLocators = () => {
    return this.locators;
  }
}
