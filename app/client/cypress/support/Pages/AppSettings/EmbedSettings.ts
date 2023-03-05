import { ObjectsRegistry } from "../../Objects/Registry";
export class EmbedSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private appSettings = ObjectsRegistry.AppSettings;

  public locators = {
    _getDimensionInput: (prefix: string) => `.t--${prefix}-dimension input`,
    _snippet: "[data-cy='t--embed-snippet']",
    _frameAncestorsSetting: "[data-cy='frame-ancestors-setting']",
    _allowAllText: "Embedding enabled",
    _restrictedText: "Embedding restricted",
    _disabledText: "Embedding disabled",
    _showNavigationBar: "[data-cy='show-navigation-bar-toggle']",
    _controlIndicator: ".bp3-control-indicator",
  };

  public OpenEmbedSettings() {
    this.appSettings.OpenAppSettings();
    this.appSettings.GoToEmbedSettings();
  }

  public UpdateDimension(dimension: "H" | "W", value: string) {
    const input = this.locators._getDimensionInput(dimension);
    this.agHelper.RemoveCharsNType(input, -1, value);
  }

  public ValidateSnippet(width: string, height: string) {
    this.agHelper.GetNAssertElementText(
      this.locators._snippet,
      `width="${width}"`,
      "contain.text",
    );
    this.agHelper.GetNAssertElementText(
      this.locators._snippet,
      `height="${height}"`,
      "contain.text",
    );
  }

  public ToggleShowNavigationBar(check: "true" | "false" = "true") {
    const input = this.agHelper.GetElement(this.locators._showNavigationBar);
    input.invoke("attr", "checked").then((value) => {
      if (value !== check) {
        this.agHelper.GetSiblingNClick(
          this.locators._showNavigationBar,
          this.locators._controlIndicator,
        );
        this.agHelper.ValidateNetworkStatus("@updateApplication");
      }
    });
  }
}
