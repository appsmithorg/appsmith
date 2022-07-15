import { ObjectsRegistry } from "../Objects/Registry";

type filedTypeValues =
  | "Array"
  | "Checkbox"
  | "Currency Input"
  | "Datepicker"
  | "Email Input"
  | "Multiselect"
  | "Multiline Text Input"
  | "Number Input"
  | "Object"
  | "Password Input"
  | "Phone Number Input"
  | "Radio Group"
  | "Select"
  | "Switch"
  | "Text Input";

export class PropertyPane {
  private agHelper = ObjectsRegistry.AggregateHelper;
  private locator = ObjectsRegistry.CommonLocators;

  _fieldConfig = (fieldName: string) =>
    "//input[@placeholder='Field label'][@value='" +
    fieldName +
    "']/ancestor::div/following-sibling::div/div[contains(@class, 't--edit-column-btn')]";
  private _goBackToProperty = "button.t--property-pane-back-btn";
  private _copyWidget = "button.t--copy-widget";
  private _deleteWidget = "button.t--delete-widget";
  private _changeThemeBtn = ".t--change-theme-btn";
  private _themeCard = (themeName: string) =>
    "//h3[text()='" +
    themeName +
    "']//ancestor::div[@class= 'space-y-1 group']";
  private _jsonFieldConfigList =
    "//div[contains(@class, 't--property-control-fieldconfiguration group')]//div[contains(@class, 'content')]/div//input";
  _propertyToggle = (controlToToggle: string) =>
    ".t--property-control-" +
    controlToToggle.replace(/ +/g, "").toLowerCase() +
    " input[type='checkbox']";
  _colorPickerV2Popover = ".t--colorpicker-v2-popover";
  _colorPickerV2Color = ".t--colorpicker-v2-color";
  _colorRing = ".border-2";

  public OpenJsonFormFieldSettings(fieldName: string) {
    this.agHelper.GetNClick(this._fieldConfig(fieldName));
  }

  public ChangeJsonFormFieldType(
    fieldName: string,
    newDataType: filedTypeValues,
  ) {
    // this.agHelper.GetElementLength(this._copyWidget).then(($len) => {
    //   if ($len == 0) {
    //     this.NavigateBackToPropertyPane();
    //   }
    // });
    this.OpenJsonFormFieldSettings(fieldName);
    this.agHelper.SelectDropdownList("Field Type", newDataType);
    this.agHelper.AssertAutoSave();
    this.agHelper.ValidateNetworkStatus("@updateLayout");
  }

  public NavigateBackToPropertyPane() {
    this.agHelper.GetNClick(this._goBackToProperty);
    this.agHelper.AssertElementVisible(this._copyWidget);
    //this.agHelper.AssertElementVisible(this._deleteWidget); //extra valisation, hence commenting!
  }

  public ChangeTheme(newTheme: string) {
    this.agHelper.GetNClick(this._changeThemeBtn, 0, true);
    this.agHelper.GetNClick(this._themeCard(newTheme));
    this.agHelper.WaitUntilToastDisappear("Theme " + newTheme + " Applied");
  }

  public ChangeColor(
    colorIndex: number,
    type: "Primary" | "Background" = "Primary",
  ) {
    const typeIndex = type == "Primary" ? 0 : 1;
    this.agHelper.GetNClick(this._colorRing, typeIndex);
    this.agHelper.GetNClick(this._colorPickerV2Popover);
    this.agHelper.GetNClick(this._colorPickerV2Color, colorIndex);
  }

  public GetJSONFormConfigurationFileds() {
    const fieldNames: string[] = [];
    let fieldInvokeValue: string;
    cy.xpath(this._jsonFieldConfigList).each(function($item) {
      cy.wrap($item)
        .invoke("val")
        .then(($fieldName: any) => {
          fieldInvokeValue = $fieldName;
          fieldNames.push(fieldInvokeValue as string);
        });
    });
    cy.wrap(fieldNames).as("fieldNames");
  }

  public UpdateJSONFormWithPlaceholders() {
    let field: string, placeHolderText: string;
    this.GetJSONFormConfigurationFileds();
    cy.get("@fieldNames").each(($filedName: any) => {
      field = $filedName;
      this.agHelper.GetNClick(this._fieldConfig(field as string));
      this.agHelper
        .GetText(this.locator._existingActualValueByName("Property Name"))
        .then(($propName) => {
          placeHolderText = "{{sourceData." + $propName + "}}";
          this.UpdatePropertyFieldValue("Placeholder", placeHolderText);
        });
      this.UpdatePropertyFieldValue("Default Value", "");
      this.NavigateBackToPropertyPane();
    });
  }

  public ToggleOnOrOff(propertyName: string, toggle: "On" | "Off" = "On") {
    if (toggle == "On") {
      cy.get(this._propertyToggle(propertyName))
        .check({ force: true })
        .should("be.checked");
    } else {
      cy.get(this._propertyToggle(propertyName))
        .uncheck({ force: true })
        .should("not.be.checked");
    }
    this.agHelper.AssertAutoSave();
  }

  public SelectJSFunctionToExecute(
    eventName: string,
    jsName: string,
    funcName: string,
  ) {
    this.agHelper.SelectPropertiesDropDown(eventName, "Execute a JS function");
    this.agHelper.GetNClick(this.locator._dropDownValue(jsName), 0, true);
    this.agHelper.GetNClick(this.locator._dropDownValue(funcName), 0, true);
    this.agHelper.AssertAutoSave();
  }

  public UpdatePropertyFieldValue(propFieldName: string, valueToEnter: string) {
    cy.xpath(this.locator._existingFieldTextByName(propFieldName)).then(
      ($field: any) => {
        this.agHelper.UpdateCodeInput($field, valueToEnter);
      },
    );
  }
}
