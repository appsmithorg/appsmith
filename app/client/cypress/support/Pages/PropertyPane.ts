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

  private isMac = Cypress.platform === "darwin";
  private selectAllJSObjectContentShortcut = `${
    this.isMac ? "{cmd}{a}" : "{ctrl}{a}"
  }`;

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
          this.UpdatePropertyFieldValue("Placeholder", placeHolderText, false);
        });
      this.RemoveText("Default Value");
      //this.UpdatePropertyFieldValue("Default Value", "");
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

  public SelectPropertiesDropDown(endpoint: string, dropdownOption: string) {
    cy.xpath(this.locator._selectPropDropdown(endpoint))
      .first()
      .scrollIntoView()
      .click();
    cy.get(this.locator._dropDownValue(dropdownOption)).click();
  }

  public SelectJSFunctionToExecute(
    eventName: string,
    jsName: string,
    funcName: string,
  ) {
    this.SelectPropertiesDropDown(eventName, "Execute a JS function");
    this.agHelper.GetNClick(this.locator._dropDownValue(jsName), 0, true);
    this.agHelper.GetNClick(this.locator._dropDownValue(funcName), 0, true);
    this.agHelper.AssertAutoSave();
  }

  public UpdatePropertyFieldValue(
    propFieldName: string,
    valueToEnter: string,
    toVerifySave = true,
  ) {
    cy.xpath(this.locator._existingFieldTextByName(propFieldName)).then(
      ($field: any) => {
        this.agHelper.UpdateCodeInput($field, valueToEnter);
      },
    );
    toVerifySave && this.agHelper.AssertAutoSave(); //Allowing time for saving entered value
  }

  public RemoveText(endp: string) {
    cy.get(
      this.locator._propertyControl +
        endp.replace(/ +/g, "").toLowerCase() +
        " " +
        this.locator._codeMirrorTextArea,
    )
      .first()
      .focus()
      .type(this.selectAllJSObjectContentShortcut)
      .type("{backspace}", { force: true });
    // .type("{uparrow}", { force: true })
    // .type("{ctrl}{shift}{downarrow}", { force: true })
    // .type("{del}", { force: true });
    this.agHelper.AssertAutoSave();
  }

  public TypeTextIntoField(endp: string, value: string) {
    this.RemoveText(endp);
    cy.get(
      this.locator._propertyControl +
        endp.replace(/ +/g, "").toLowerCase() +
        " " +
        this.locator._codeMirrorTextArea,
    )
      .first()
      .then((el: any) => {
        cy.get(el).type(value, {
          parseSpecialCharSequences: false,
          force: true,
        });
      });

    this.agHelper.AssertAutoSave(); //Allowing time for saving entered value
  }
}
