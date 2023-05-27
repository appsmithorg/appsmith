import { ObjectsRegistry } from "../../Objects/Registry";

export class EmbedSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private appSettings = ObjectsRegistry.AppSettings;

  public locators = {
    _getDimensionInput: (prefix: string) => `.t--${prefix}-dimension input`,
    _snippet: "[data-testid='t--embed-snippet']",
    _frameAncestorsSetting: "[data-testid='frame-ancestors-setting']",
    _allowAllText: "Embedding enabled",
    _restrictedText: "Embedding restricted",
    _disabledText: "Embedding disabled",
    _showNavigationBar: "[data-testid='show-navigation-bar-toggle']",
    _enableForking: "[data-testid='forking-enabled-toggle']",
    _confirmForking: "[data-testid='allow-forking']",
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
        this.agHelper.GetNClick(this.locators._showNavigationBar);
        this.agHelper.ValidateNetworkStatus("@updateApplication");
      }
    });
  }

  public ToggleMarkForkable(check: "true" | "false" = "true") {
    const input = this.agHelper.GetElement(this.locators._enableForking);
    input.invoke("attr", "checked").then((value) => {
      if (value !== check) {
        this.agHelper.GetNClick(this.locators._enableForking);

        if (check) {
          this.agHelper.GetNClick(this.locators._confirmForking);
        }

        this.agHelper.ValidateNetworkStatus("@updateApplication");
      }
    });
  }
}
