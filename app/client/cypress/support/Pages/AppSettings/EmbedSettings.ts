import { ObjectsRegistry } from "../../Objects/Registry";

export class EmbedSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private appSettings = ObjectsRegistry.AppSettings;
  private assertHelper = ObjectsRegistry.AssertHelper;
  private propPane = ObjectsRegistry.PropertyPane;

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
    _enablePublicAccessSettingsPage:
      "[data-testid=t--embed-settings-application-public]",
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

  public ToggleShowNavigationBar(
    toggle: "On" | "Off" = "On",
    toCheckNetwork = true,
  ) {
    this.propPane.TogglePropertyState(
      "Show navigation bar",
      toggle,
      toCheckNetwork == true ? "updateApplication" : "",
    );
  }

  public ToggleMarkForkable(check: "true" | "false" = "true") {
    const input = this.agHelper.GetElement(this.locators._enableForking);
    input.invoke("attr", "checked").then((value) => {
      if (value !== check) {
        this.agHelper.GetNClick(this.locators._enableForking);

        if (check) {
          this.agHelper.GetNClick(this.locators._confirmForking);
        }

        this.assertHelper.AssertNetworkStatus("@updateApplication");
      }
    });
  }

  public TogglePublicAccess(check: true | false = true) {
    this.agHelper
      .GetElement(this.locators._enablePublicAccessSettingsPage)
      .invoke("prop", "checked")
      .then((isChecked) => {
        if (isChecked !== check) {
          this.agHelper.GetNClick(
            this.locators._enablePublicAccessSettingsPage,
          );
          this.assertHelper.AssertNetworkStatus("@changeAccess");
        }
      });
  }
}
