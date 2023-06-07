import { __assign } from "tslib";
import { ObjectsRegistry } from "../../Objects/Registry";

export class ThemeSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  public locators = {
    _changeThemeBtn: ".t--change-theme-btn",
    _themeCard: (themeName: string) =>
      "//h3[text()='" +
      themeName +
      "']//ancestor::div[@class= 'space-y-1 group']",
    _colorPickerV2Popover: ".t--colorpicker-v2-popover",
    _colorPickerV2Color: ".t--colorpicker-v2-color",
    _colorRingPrimary: "[data-testid='theme-primaryColor']",
    _colorRingBackground: "[data-testid='theme-backgroundColor']",
    _colorInput: (option: string) =>
      "//h3[text()='" + option + " color']//parent::div//input",
    _colorInputField: (option: string) =>
      "//h3[text()='" + option + " color']//parent::div",
    _boxShadow: (type: string) =>
      "//p[text()='App box shadow']/following-sibling::div//span[contains(@class, 'ads-v2-segmented-control-value-" +
      type +
      "')]/div",
    _border: ".t--theme-appBorderRadius",
    _popover: ".rc-tooltip-inner",
    _appliedThemeSection: "Applied Theme",
    _appliedThemecard: ".t--theme-card main > main",
    _testWidgetMutliSelect:
      ".t--draggable-multiselectwidgetv2:contains('more')",
    _canvas: "#canvas-selection-0",
    _shadow: ".t--theme-appBoxShadow",
    _inputColor: ".t--colorpicker-v2-popover input",
    _colorPicker: "[data-testid='color-picker']",
    _currentTheme: ".cursor-pointer:contains('Applied Theme')",
  };

  public ChangeTheme(newTheme: string) {
    this.agHelper.GetNClick(this.locators._changeThemeBtn, 0, true);
    this.agHelper.GetNClick(this.locators._themeCard(newTheme));
    this.agHelper.AssertContains("Theme " + newTheme + " Applied");
  }

  public ChangeThemeColor(
    colorIndex: number | string,
    type: "Primary" | "Background" = "Primary",
  ) {
    const colorType =
      type == "Primary"
        ? this.locators._colorRingPrimary
        : this.locators._colorRingBackground;
    this.agHelper.Sleep(200); //for themes to complete opening
    this.agHelper.GetNClick(colorType);
    this.agHelper.Sleep(200); //for themes to complete opening
    if (typeof colorIndex == "number") {
      this.agHelper.GetNClick(this.locators._colorPickerV2Popover);
      this.agHelper.GetNClick(this.locators._colorPickerV2Color, colorIndex);
    } else {
      this.agHelper.GetElement(this.locators._colorInput(type)).clear();
      this.agHelper.TypeText(this.locators._colorInput(type), colorIndex); //Doing it again for since sometimes it does not type properpy
      this.agHelper.GetElement(this.locators._colorInput(type)).clear();
      this.agHelper.TypeText(this.locators._colorInput(type), colorIndex);
      //this.agHelper.UpdateInput(this._colorInputField(type), colorIndex);//not working!
    }
  }

  public ChooseColorType(type: "Primary" | "Background" = "Primary") {
    const colorType =
      type == "Primary"
        ? this.locators._colorRingPrimary
        : this.locators._colorRingBackground;
    this.agHelper.Sleep(200); //for themes to complete opening
    this.agHelper.GetNClick(colorType);
    this.agHelper.Sleep(200); //for themes to complete opening
  }

  public ChooseColorFromColorPicker(color: string) {
    this.agHelper.GetNClick(color);
  }

  public AssertBorderPopoverText(
    index: number,
    text: string,
    eleindex: number,
  ) {
    this.agHelper.GetNMouseover(this.locators._border, index);
    this.agHelper.Sleep();
    this.agHelper.GetNAssertElementText(
      this.locators._popover,
      text,
      "contain.text",
      eleindex,
    );
    this.agHelper.Sleep();
    this.agHelper.GetNClick(this.locators._border, index);
    this.agHelper.ValidateNetworkStatus("@updateTheme", 200);
  }

  public ToggleSection(section: string) {
    this.agHelper.ContainsNClick(section);
  }

  public AssertShadowPopoverText(
    index: number,
    text: string,
    eleindex: number,
  ) {
    this.agHelper
      .GetElement(this.locators._boxShadow(text))
      .trigger("mouseover", { force: true })
      .wait(500);
    this.agHelper.Sleep();

    this.agHelper.GetNAssertElementText(
      this.locators._popover,
      text,
      "contain.text",
      eleindex,
    );
    this.agHelper
      .GetElement(this.locators._boxShadow(text))
      .click({ force: true });
    this.agHelper.ValidateNetworkStatus("@updateTheme", 200);
  }
}
