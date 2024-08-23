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
    accentColorInput: "[data-testid=t--color-picker-input]",
    fontFamilySectionInput:
      "[data-testid=t--anvil-theme-settings-font-family] input",
    densityOptions: "[data-testid=t--anvil-theme-settings-density] > div",
    sizingOptions: "[data-testid=t--anvil-theme-settings-sizing] > div",
    cornersOptions: "[data-testid=t--anvil-theme-settings-corners] > div",
    iconStyleOptions: "[data-testid=t--anvil-theme-settings-icon-style] > div",
  };

  /**
   * This method is used to match the snapshot of the canvas, preview, and deploy mode.
   * Also, it generates/tests with snapshot name based on the widget name, mode, and theme.
   * For e.g -
   * - ("ButtonWidget", "canvas", "light") -> AnvilButtonWidgetCanvas
   * - ("ButtonWidget", "preview", "dark") -> AnvilButtonWidgetPreviewDark
   */
  public matchSnapshot(
    locator: string,
    name: string,
    mode: "canvas" | "preview" | "deploy" = "canvas",
    theme: "light" | "dark" = "light",
    size?: Cypress.ViewportPreset,
  ) {
    const snapshotName = camelCase(
      `anvil_${name}$_${mode}${theme == "dark" ? "_dark" : ""}${size ? `_${size}` : ""}`,
    );

    this.agHelper.GetElement(locator).matchImageSnapshot(snapshotName);
  }

  public matchSnapshotForCanvasMode = (
    name: string,
    theme: Parameters<typeof this.matchSnapshot>[3] = "light",
  ) => {
    this.matchSnapshot(this.locators.canvas, name, "canvas", theme);
  };

  public matchSnapshotForPreviewMode = (
    name: string,
    theme: Parameters<typeof this.matchSnapshot>[3] = "light",
  ) => {
    this.enterPreviewMode();

    this.matchSnapshot(this.locators.canvas, name, "preview", theme);

    this.exitPreviewMode();
  };

  public matchSnapshotForDeployMode = (
    name: string,
    theme: Parameters<typeof this.matchSnapshot>[3] = "light",
  ) => {
    this.deployMode.DeployApp(this.locators.appViewerPage);

    this.matchSnapshot(this.locators.appViewerPage, name, "deploy", theme);

    (["macbook-13", "iphone-6", "ipad-2"] as const).forEach((device) => {
      cy.viewport(device);

      this.matchSnapshot(
        this.locators.appViewerPage,
        name,
        "deploy",
        theme,
        device,
      );
    });

    cy.viewport(1400, 1200);

    this.agHelper.BrowserNavigation(-1);
  };

  public enterPreviewMode = () => {
    this.agHelper.GetNClick(this.locators.enterPreviewMode);
    this.agHelper.GetNClick(
      this.locators.canvas,
      0,
      false,
      500,
      false,
      false,
      "topLeft",
    );
  };

  private exitPreviewMode = () => {
    this.agHelper.GetNClick(this.locators.exitPreviewMode);
    this.agHelper.GetNClick(
      this.locators.canvas,
      0,
      false,
      500,
      false,
      false,
      "topLeft",
    );
  };

  public setTheme = (theme: "light" | "dark") => {
    this.updateThemeOption(() => {
      this.agHelper.GetNClick(
        `${this.locators.colorMode} [data-value=${theme.toUpperCase()}]`,
      );
    });
  };

  public setAccentColor = (color: string) => {
    this.updateThemeOption(() => {
      cy.get(this.locators.accentColorInput).clear().type(color);
    });
  };

  public setTypography = (name: string) => {
    this.updateThemeOption(() => {
      cy.get(this.locators.fontFamilySectionInput).click({ force: true });

      cy.get(".rc-virtual-list .rc-select-item-option")
        .find(".leading-normal")
        .contains(name)
        .click({ force: true });

      cy.contains("Typography").click({ force: true });
    });
  };

  public setDensity = (density: string) => {
    this.updateThemeOption(() => {
      cy.get(this.locators.densityOptions)
        .contains(density)
        .click({ force: true });
    });
  };

  public setSizing = (sizing: string) => {
    this.updateThemeOption(() => {
      cy.get(this.locators.sizingOptions)
        .contains(sizing)
        .click({ force: true });
    });
  };

  public setCorners = (corner: string) => {
    this.updateThemeOption(() => {
      cy.get(`${this.locators.cornersOptions} [data-value="${corner}"]`).click({
        force: true,
      });
    });
  };

  public setIconStyle = (iconStyle: string) => {
    this.updateThemeOption(() => {
      cy.get(this.locators.iconStyleOptions)
        .contains(iconStyle)
        .click({ force: true });
    });
  };

  public updateThemeOption = (callback: () => void) => {
    this.appSettings.OpenAppSettings();
    this.appSettings.GoToThemeSettings();

    callback();

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
