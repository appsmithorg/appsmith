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

  public clickOnChangeTheme() {
    this.agHelper.GetNClick(this.locators._changeThemeBtn, 0, true);
  }

  public clickOnAppliedTheme() {
    this.agHelper.ContainsNClick(this.locators._appliedThemeSection);
  }
  public validateBorderTypeCount(expectedcount: number) {
    cy.get(this.locators._border).should("have.length", expectedcount);
  }

  public validateBorderPopoverText(index: number, text: string) {
    this.agHelper.GetNMouseover(this.locators._border, index);
    this.agHelper.Sleep();
    this.agHelper.GetNAssertElementTextLast(
      this.locators._popover,
      text,
      "contain.text",
    );
    this.agHelper.Sleep();
    this.agHelper.GetNClick(this.locators._border, index);
    cy.wait("@updateTheme").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  }

  public clickOnBorderType(index: number, text: string) {
    this.agHelper.GetNClick(this.locators._border, index);
  }

  public toggleSection(section: string) {
    this.agHelper.ContainsNClick(section);
  }

  public validateShadowPopoverText(index: number, text: string) {
    this.agHelper
      .GetElement(this.locators._boxShadow(text))
      .trigger("mouseover", { force: true })
      .wait(500);
    this.agHelper.Sleep();

    //this.agHelper.GetNMouseover(this.locators._boxShadow(text), index);
    this.agHelper.GetNAssertElementTextLast(
      this.locators._popover,
      text,
      "contain.text",
    );
    this.agHelper
      .GetElement(this.locators._boxShadow(text))
      .click({ force: true });
    cy.wait("@updateTheme").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  }
}
