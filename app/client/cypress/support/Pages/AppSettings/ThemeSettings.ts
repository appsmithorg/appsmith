import { ObjectsRegistry } from "../../Objects/Registry";

export class ThemeSettings {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locators = {
    _changeThemeBtn: ".t--change-theme-btn",
    _themeCard: (themeName: string) =>
      "//h3[text()='" +
      themeName +
      "']//ancestor::div[@class= 'space-y-1 group']",
    _colorPickerV2Popover: ".t--colorpicker-v2-popover",
    _colorPickerV2Color: ".t--colorpicker-v2-color",
    _colorRingPrimary: "[data-testid='theme-primaryColor']",
    _colorRingBackground: "[data-testid='theme-backgoundColor']",
    _colorInput: (option: string) =>
      "//h3[text()='" + option + " Color']//parent::div//input",
    _colorInputField: (option: string) =>
      "//h3[text()='" + option + " Color']//parent::div",
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
}
