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
  private jsEditor = ObjectsRegistry.JSEditor;
  private locator = ObjectsRegistry.CommonLocators;

  _fieldConfig = (fieldName: string) =>
    "//input[@placeholder='Field label'][@value='" +
    fieldName +
    "']/ancestor::div/following-sibling::div[contains(@class, 't--edit-column-btn')]";
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
    this.agHelper.ValidateToastMessage("Theme " + newTheme + " Applied");
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
          this.jsEditor.EnterJSContext("Placeholder", placeHolderText);
        });
      this.jsEditor.EnterJSContext("Default Value", "");
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
}
