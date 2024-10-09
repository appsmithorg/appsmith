import { ObjectsRegistry } from "../Objects/Registry";
import EditorNavigation, { EntityType, PageLeftPane } from "./EditorNavigation";

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
  private assertHelper = ObjectsRegistry.AssertHelper;

  _propertyPaneSidebar = ".t--property-pane-sidebar";
  _jsonFieldEdit = (fieldName: string) =>
    "//input[@placeholder='Field label'][@value='" +
    fieldName +
    "']/ancestor::div/following-sibling::div/button[contains(@class, 't--edit-column-btn')]";
  public _goBackToProperty = "button[data-testid='t--property-pane-back-btn']";
  private _copyWidget = "[data-testid='t--copy-widget']";
  _deleteWidget = "[data-testid='t--delete-widget']";
  private _styleTabBtn = (tab: string) =>
    "button[role='tab'] span:contains('" + tab + "')";
  private _themeCard = (themeName: string) =>
    "//h3[text()='" +
    themeName +
    "']//ancestor::div[@class= 'space-y-1 group']";
  private _jsonFieldConfigList =
    "//div[contains(@class, 't--property-control-fieldconfiguration group')]//div[contains(@class, 'content')]/div//input";
  _tableEditColumnButton = ".t--edit-column-btn";
  private _tableColumnSettings = (column: string) =>
    `[data-rbd-draggable-id='${column}'] ${this._tableEditColumnButton}`;
  private _sectionCollapse = (section: string) =>
    `.t--property-pane-section-collapse-${section}`;
  private _sectionCollapseWithTag = (section: string, tab: string) =>
    `.t--property-pane-section-collapse-${section} .t--property-section-tag-${tab}`;
  _propertyControl = (property: string) => `.t--property-control-${property}`;
  private _addAction = (property: string) => `.t--add-action-${property}`;
  _propertyPaneSearchInputWrapper = ".t--property-pane-search-input-wrapper";
  _propertyPaneSearchInput = `${this._propertyPaneSearchInputWrapper} input`;
  _propertyPaneEmptySearchResult = ".t--property-pane-no-search-results";
  _mode = (modeName: string) =>
    "//span[contains(text(),'" + modeName + "')]//parent::span";
  _propertyToggle = (controlToToggle: string) =>
    "//div[contains(@class,'t--property-control-" +
    controlToToggle.replace(/ +/g, "").toLowerCase() +
    "')]//input[@type='checkbox'] | //label[text()='" +
    controlToToggle +
    "']//input[@type='checkbox']";
  _colorPickerV2Popover = ".t--colorpicker-v2-popover";
  _colorPickerV2Color = ".t--colorpicker-v2-color";
  _colorInput = (option: string) =>
    "//h3[text()='" + option + " Color']//parent::div//input";
  _colorInputField = (option: string) =>
    "//h3[text()='" + option + " Color']//parent::div";
  _actionSelectorPopup = ".t--action-selector-popup";
  _actionCollapsibleHeader = (label: string) =>
    `.ads-v2-collapsible__header:has(label[for="${label}"])`;
  _actionSelectorFieldByLabel = (label: string) =>
    `.t--action-selector-popup label[for="${label}"] + div .CodeMirror textarea, .t--action-selector-popup .ads-v2-collapsible__header:has(label[for="${label}"]) + div .CodeMirror textarea`;
  _actionSelectorFieldContentByLabel = (label: string) =>
    `.t--action-selector-popup label[for="${label}"] + div, .t--action-selector-popup .ads-v2-collapsible__header:has(label[for="${label}"]) + div`;
  _actionCardByTitle = (title: string) =>
    `[data-testid='action-card-${title}']`;
  _actionCallbacks = ".t--action-callbacks";
  _actionAddCallback = (type: "success" | "failure") =>
    `.t--action-add-${type}-callback`;
  _actionSelectorPopupClose = `${this._actionSelectorPopup} .t--close`;
  _actionSelectorDelete = `${this._actionSelectorPopup} .t--delete`;
  _actionCard = ".action-block-tree";
  _actionCallbackTitle = ".action-callback-add";
  _actionTreeCollapse = ".callback-collapse";
  _actionPopupTextLabel = '[data-testid="text-view-label"]';
  _actionOpenDropdownSelectModal = ".t--open-dropdown-Select-modal";
  _selectorViewButton = ".selector-view .bp3-button-text";
  _actionOpenDropdownSelectPage = ".t--open-dropdown-Select-page";
  _sameWindowDropdownOption = ".t--open-dropdown-Same-window";
  _windowTargetDropdown = ".t--open-dropdown-Window";
  _navigateToType = (type: string) =>
    "div.tab-view span:contains('" + type + "')";

  _dropdownSelectType = ".t--open-dropdown-Select-type";
  _selectorViewLabel = '[data-testId="selector-view-label"]';
  _textView = ".text-view";
  _selectorView = ".selector-view";
  _dropdownOptions =
    "//div[@class='rc-virtual-list']//div[contains(@class, 'rc-select-item-option')]";
  _dropDownValue = (dropdownOption: string) =>
    `${this._dropdownOptions}//span[text()='${dropdownOption}']`;
  _selectPropDropdown = (ddName: string) =>
    "//div[contains(@class, 't--property-control-" +
    ddName.replace(/ +/g, "").toLowerCase() +
    "')]//input[@class='rc-select-selection-search-input'] | //p[text()='" +
    ddName +
    "']/ancestor::div[@class='form-config-top']/following-sibling::div" +
    "//input[@class='rc-select-selection-search-input']";
  _selectPropDropdownValue = (ddName: string) =>
    "//div[contains(@class, 't--property-control-" +
    ddName.replace(/ +/g, "").toLowerCase() +
    "')]//input[@class='rc-select-selection-search-input']/parent::span/following-sibling::span//span | //div[contains(@class, 't--property-control-" +
    ddName.replace(/ +/g, "").toLowerCase() +
    "')]//input[@class='rc-select-selection-search-input']/parent::span/following-sibling::span | //div[contains(@class, 't--property-control-" +
    ddName.replace(/ +/g, "").toLowerCase() +
    "')]//div[@class='selected-item']/div";
  public _createModalButton = ".t--create-modal-btn";
  _pageName = (option: string) => "//a/div[text()='" + option + "']";
  private isMac = Cypress.platform === "darwin";
  private selectAllJSObjectContentShortcut = `${
    this.isMac ? "{cmd}{a}" : "{ctrl}{a}"
  }`;
  private _propPaneSelectedItem = (option: string) =>
    `.t--property-control-${option} span.rc-select-selection-item span`;
  _propertyDateFormat = ".t--property-control-dateformat";
  _propertyPanePropertyControl = (propPane: string, propControl: string) =>
    `.t--property-pane-section-${propPane} .t--property-control-${propControl}`;
  _autoHeightLimitMin = "[data-testid='t--auto-height-overlay-handles-min']";
  _autoHeightLimitMin_div =
    "[data-testid='t--auto-height-overlay-handles-min'] div";
  _autoHeightLimitMax = "[data-testid='t--auto-height-overlay-handles-max']";
  public _labelContains = (value: string) => `label:Contains('${value}')`;
  _showColumnButton = ".t--show-column-btn";
  _propertyPaneHeightLabel =
    ".t--property-pane-section-general .t--property-control-label:contains('Height')";
  _tabId1 = ".t--tabid-tab1";
  _tabId2 = ".t--tabid-tab2";
  _showTabsProperty = ".t--property-control-showtabs input";
  _addOptionProperty = ".t--property-control-options-add";
  _optionContent = ".rc-select-item-option-content";
  _dropdownOptionSpan = ".t--dropdown-option span";
  public _propertyControlColorPicker = (property: string) =>
    `.t--property-control-${property} .bp3-input-group input`;
  public _propertyControlSelectedColorButton = (property: string) =>
    `.t--property-control-${property} ${this._fillColor}`;
  _propertyText = ".bp3-ui-text span";
  _paneTitle = ".t--property-pane-title";
  _segmentedControl = (value: string) =>
    `.ads-v2-segmented-control-value-${value}`;
  _addMenuItem = ".t--add-menu-item-btn";
  _addColumnItem = ".t--add-column-btn";
  _widgetToVerifyText = (widgetName: string) =>
    `${this.locator._widgetByName(widgetName)} ${this._propertyText}`;
  _placeholderName = "[placeholder='Name']";
  _placeholderValue = "[placeholder='Value']";
  _optionsDeleteButton = "[orientation='HORIZONTAL'] .ads-v2-button";
  _colorPickerInput = "[data-testid='t--color-picker-input']";
  _emphasisSelector = (value: string) => `.t--button-group-${value}`;
  _checkbox = ".bp3-checkbox";
  _roundCursorPointer = ".rounded-full.cursor-pointer";
  _sliderMark = ".slider-mark";
  _styleSize = (size: string) => `.ads-v2-segmented-control-value-${size}`;
  _themeColor =
    "//h3[text()='Theme Colors']//..//div[contains(@class, 't--colorpicker-v2-color')]";
  _fillColor = ".t--colorpicker-v2-popover .rounded-full";
  _multiSelect = ".rc-select-multiple";
  _currencyChangeDropdownIcon =
    ".currency-change-dropdown-trigger .remixicon-icon";
  _countryCodeChangeDropDown = ".t--input-country-code-change .remixicon-icon";
  _searchCountryPlaceHolder = "[placeholder='Search by ISD code or country']";
  _closeModal = "//*[contains(@class,'ads-v2-button t--close')]";
  _zoomLevelInput = ".t--property-control-zoomlevel input";
  _zoomLevelControl = (control: "start" | "end") =>
    ".t--property-control-zoomlevel .ads-v2-input__input-section-icon-" +
    control;

  _dataIcon = (icon: string) => `[data-icon="${icon}"]`;
  _iconDropdown = "[data-test-id='virtuoso-scroller']";
  _dropdownControlError = "[data-testid='t---dropdown-control-error']";

  public OpenJsonFormFieldSettings(fieldName: string) {
    this.agHelper.GetNClick(this._jsonFieldEdit(fieldName));
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
    this.SelectPropertiesDropDown("Field Type", newDataType);
    this.agHelper.AssertAutoSave();
    this.assertHelper.AssertNetworkStatus("@updateLayout");
  }

  public NavigateBackToPropertyPane(assertElementVisible = true) {
    this.agHelper.GetNClick(this._goBackToProperty);

    if (assertElementVisible) {
      this.agHelper.AssertElementVisibility(this._copyWidget);
    }
    //this.agHelper.AssertElementVisibility(this._deleteWidget); //extra valisation, hence commenting!
  }

  public CopyPasteWidgetFromPropertyPane(widgetName: string) {
    EditorNavigation.SelectEntityByName(widgetName, EntityType.Widget);
    this.agHelper.GetNClick(this._copyWidget);
    this.agHelper.Sleep(200);
    cy.get("body").type(`{${this.agHelper._modifierKey}}v`);
    this.agHelper.Sleep(500);
    PageLeftPane.assertPresence(widgetName + "Copy");
  }

  public DeleteWidgetDirectlyFromPropertyPane() {
    this.agHelper.GetNClick(this._deleteWidget);
  }

  public DeleteWidgetFromPropertyPane(widgetName: string) {
    EditorNavigation.SelectEntityByName(widgetName, EntityType.Widget);
    this.DeleteWidgetDirectlyFromPropertyPane();
    this.agHelper.Sleep(500);
    PageLeftPane.assertAbsence(widgetName);
  }

  public GetJSONFormConfigurationFileds() {
    const fieldNames: string[] = [];
    let fieldInvokeValue: string;
    cy.xpath(this._jsonFieldConfigList).each(function ($item) {
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
      this.OpenJsonFormFieldSettings(field as string);
      this.agHelper.Sleep(200);
      this.RemoveText("Default value", false);
      this.agHelper
        .GetText(this.locator._existingActualValueByName("Property Name"))
        .then(($propName) => {
          placeHolderText = "{{sourceData." + $propName + "}}";
          this.UpdatePropertyFieldValue("Placeholder", placeHolderText, false);
        });
      cy.focused().blur();
      //this.RemoveText("Default value", false);
      //this.UpdatePropertyFieldValue("Default value", "");
      this.NavigateBackToPropertyPane();
    });
  }

  public TogglePropertyState(
    propertyName: string,
    toggle: "On" | "Off" = "On",
    networkCall = "updateLayout",
  ) {
    if (toggle == "On") {
      this.agHelper
        .GetElement(this._propertyToggle(propertyName))
        .check({ force: true })
        .should("be.checked");
    } else {
      this.agHelper
        .GetElement(this._propertyToggle(propertyName))
        .uncheck({ force: true })
        .should("not.be.checked");
    }
    this.agHelper.AssertAutoSave();
    networkCall && this.assertHelper.AssertNetworkStatus(networkCall);
  }

  public MoveToTab(tab: "Content" | "Style") {
    this.agHelper.GetNClick(this._styleTabBtn(tab));
    this.agHelper.Sleep();
  }

  public SelectPropertiesDropDown(
    endpoint: string,
    dropdownOption: string,
    action: "Action" | "Page" = "Action",
    index = 0,
    optionIndex = 0,
    force = false,
  ) {
    if (action == "Action")
      this.agHelper.GetNClick(this._selectPropDropdown(endpoint), index);
    else
      this.agHelper.GetNClick(
        this.locator._selectPropPageDropdown(endpoint),
        index,
      );
    this.agHelper.GetNClick(
      this._dropDownValue(dropdownOption),
      optionIndex,
      force,
    );
  }

  public AssertPropertiesDropDownCurrentValue(
    endpoint: string,
    dropdownExpectedSelection: string,
  ) {
    this.agHelper
      .GetElement(this._selectPropDropdownValue(endpoint))
      .then(($ddVisibleTexts: any) => {
        let found = false;
        $ddVisibleTexts.each((index: any, element: any) => {
          const spanText = Cypress.$(element).text().trim();
          if (spanText === dropdownExpectedSelection) {
            found = true;
            cy.log("selected dropdown text is " + spanText);
            return false; // Exit the loop if the expected text is found
          }
        });
        expect(found).to.be.true;
      });
  }

  public AssertPropertiesDropDownValues(
    endpoint: string,
    dropdownExpectedValues: string[],
  ) {
    this.agHelper.GetNClick(this._selectPropDropdown(endpoint));
    this.agHelper
      .GetElement(this._dropdownOptions)
      .then(($ddVisibleTexts: any) => {
        let foundAll = true; // Flag to track if all expected selections are found
        const foundSelections: string[] = []; // Array to track found selections
        $ddVisibleTexts.each((index: any, element: any) => {
          const spanText = Cypress.$(element).text().trim();
          foundSelections.push(spanText);
        });
        // Check if all expected selections are found in the dropdown
        dropdownExpectedValues.forEach((expectedSelection) => {
          if (!foundSelections.includes(expectedSelection)) {
            foundAll = false;
            cy.log("Expected dropdown text not found: " + expectedSelection);
          }
        });
        expect(foundAll).to.be.true;
        cy.log("All dropdown values are present");
      });
    this.agHelper.GetNClick(this._selectPropDropdown(endpoint)); //Closing dropdown
  }

  public SelectJSFunctionToExecuteInExistingActionBlock(
    jsName: string,
    funcName: string,
  ) {
    cy.get(".t--action-selector-popup .bp3-button").click({ force: true });
    this.agHelper.GetNClick(
      this.locator._dropDownValue("Execute a JS function"),
      0,
      true,
    );
    this.agHelper.GetNClick(this.locator._dropDownValue(jsName), 0, true);
    this.agHelper.GetNClick(this.locator._dropDownValue(funcName), 0, true);
    this.agHelper.AssertAutoSave();
  }

  public SelectJSFunctionToExecute(
    eventName: string,
    jsName: string,
    funcName: string,
  ) {
    this.AddAction(eventName);
    this.agHelper.GetNClick(
      this.locator._dropDownValue("Execute a JS function"),
      0,
      true,
    );
    this.agHelper.GetNClick(this.locator._dropDownValue(jsName), 0, true);
    this.agHelper.GetNClick(this.locator._dropDownValue(funcName), 0, true);
    this.agHelper.AssertAutoSave();
  }

  public UpdatePropertyFieldValue(
    propFieldName: string,
    valueToEnter: string,
    toVerifySave = true,
    toValidateNetworkCall = true,
  ) {
    this.agHelper.UpdateCodeInput(
      this.locator._existingFieldTextByName(propFieldName),
      valueToEnter,
    );
    toVerifySave && this.agHelper.AssertAutoSave(); //Allowing time for saving entered value
    toValidateNetworkCall &&
      this.assertHelper.AssertNetworkStatus("@updateLayout");
  }

  public ValidatePropertyFieldValue(
    propFieldName: string,
    valueToValidate: string,
  ) {
    cy.xpath(this.locator._existingFieldTextByName(propFieldName)).then(
      ($field: any) => {
        this.agHelper.ValidateCodeEditorContent($field, valueToValidate);
      },
    );
    return cy.wrap(valueToValidate);
  }

  public ValidateJSFieldValue(fieldName: string, valueToValidate: string) {
    this.agHelper.GetNClick(this.locator._jsToggle(fieldName.toLowerCase()));
    this.ValidatePropertyFieldValue(fieldName, valueToValidate);
    this.agHelper.GetNClick(this.locator._jsToggle(fieldName.toLowerCase()));
  }

  public ToggleJSMode(endp: string, toToggleOnJS: true | false = true) {
    cy.get(this.locator._jsToggle(endp.replace(/ +/g, "").toLowerCase()))
      .invoke("attr", "class")
      .then((classes: any) => {
        if (toToggleOnJS && !classes.includes("is-active"))
          this.agHelper.GetNClick(
            this.locator._jsToggle(endp.replace(/ +/g, "").toLowerCase()),
            0,
            true,
          );
        else if (!toToggleOnJS && classes.includes("is-active"))
          this.agHelper.GetNClick(
            this.locator._jsToggle(endp.replace(/ +/g, "").toLowerCase()),
            0,
            true,
          );
        else this.agHelper.Sleep(500);
      });
  }

  public EvaluateExistingPropertyFieldValue(fieldName = "", currentValue = "") {
    let val: any;
    if (fieldName) {
      cy.xpath(this.locator._existingFieldValueByName(fieldName)).eq(0).click();
      val = this.agHelper
        .GetElement(this.locator._existingFieldValueByName(fieldName))
        .then(($field) => {
          cy.wrap($field).find(".CodeMirror-code span").first().invoke("text");
        });
    } else {
      this.agHelper.GetNClick(this.locator._codeMirrorCode);
      val = cy
        .xpath(
          "//div[@class='CodeMirror-code']//span[contains(@class,'cm-m-javascript')]",
        )
        .then(($field) => {
          cy.wrap($field).invoke("text");
        });
    }
    this.agHelper.Sleep(); //Increasing wait time to evaluate non-undefined values
    if (currentValue) expect(val).to.eq(currentValue);
    return val;
  }

  public RemoveText(endp: string, toVerifySave = true) {
    this.agHelper
      .GetElement(this.locator._propertyInputField(endp))
      .first()
      .scrollIntoView()
      .focus()
      .wait(200)
      .type(this.selectAllJSObjectContentShortcut)
      .type("{backspace}", { force: true });

    //to select all & delete - method 2:
    // .type("{uparrow}", { force: true })
    // .type("{ctrl}{shift}{downarrow}", { force: true })
    // .type("{del}", { force: true });

    toVerifySave && this.agHelper.AssertAutoSave();
  }

  public TypeTextIntoField(
    endp: string,
    value: string,
    removeText = true,
    toVerifySave = true,
  ) {
    if (removeText) {
      this.RemoveText(endp, toVerifySave);
    }
    this.agHelper
      .GetElement(this.locator._propertyInputField(endp))
      .first()
      .then((el: any) => {
        cy.get(el).type(value, {
          parseSpecialCharSequences: false,
          force: true,
        });
      });

    this.agHelper.AssertAutoSave(); //Allowing time for saving entered value
  }

  public ToggleCommentInTextField(endp: string) {
    this.agHelper
      .GetElement(this.locator._propertyInputField(endp))
      .first()
      .then((el: any) => {
        cy.get(el).type(this.agHelper.isMac ? "{meta}/" : "{ctrl}/");
      });

    this.agHelper.AssertAutoSave(); //Allowing time for saving entered value
  }

  public EnterJSContext(
    endp: string,
    value: string,
    toToggleOnJS = true,
    paste = true,
  ) {
    this.ToggleJSMode(endp, toToggleOnJS);

    if (paste) this.UpdatePropertyFieldValue(endp, value);
    else this.TypeTextIntoField(endp, value);

    this.agHelper.AssertAutoSave(); //Allowing time for Evaluate value to capture value
  }

  public OpenTableColumnSettings(column: string) {
    this.agHelper.GetNClick(this._tableColumnSettings(column));
  }

  public Search(query: string) {
    this.agHelper.ClearNType(this._propertyPaneSearchInput, query);
    this.agHelper.Sleep();
  }

  public ToggleSection(section: string) {
    this.agHelper.GetNClick(this._sectionCollapse(section));
  }

  public AssertSearchInputValue(value: string) {
    this.agHelper.AssertText(this._propertyPaneSearchInput, "val", value);
  }

  // Checks if the property exists in search results
  public AssertIfPropertyOrSectionExists(
    section: string,
    tab: "CONTENT" | "STYLE",
    property?: string,
  ) {
    this.agHelper.AssertElementExist(
      this._sectionCollapseWithTag(section, tab),
    );
    if (property)
      this.agHelper.AssertElementExist(this._propertyControl(property));
  }

  public AssertIfPropertyIsVisible(property: string) {
    this.agHelper.AssertElementVisibility(this._propertyControl(property));
  }

  public AssertIfPropertyIsNotVisible(property: string) {
    this.agHelper.AssertElementVisibility(
      this._propertyControl(property),
      false,
    );
  }

  public AddAction(property: string) {
    this.agHelper.GetNClick(this._addAction(property), 0, true);
  }

  public SelectPlatformFunction(
    eventName: string,
    dropdownValue: string,
    force = false,
    index = 0,
  ) {
    this.AddAction(eventName);
    this.agHelper.GetNClick(
      this.locator._dropDownValue(dropdownValue),
      index,
      force,
    );
  }

  public SelectActionByTitleAndValue(title: string, value: string) {
    cy.get(this._actionCardByTitle(title)).children().contains(value).click();
  }

  public ClearActionField(property: string) {
    cy.get(this.locator._jsToggle(property.toLowerCase())).click();
    this.UpdatePropertyFieldValue(property, "");
    cy.get(this.locator._jsToggle(property.toLowerCase())).click();
  }

  public AssertJSToggleState(property: string, state: "enabled" | "disabled") {
    cy.get(
      this.locator._jsToggle(property.toLowerCase().replaceAll(" ", "")),
    ).should(`be.${state}`);
  }

  public AssertSelectValue(value: string) {
    this.agHelper.AssertElementExist(this.locator._selectByValue(value));
  }

  public RenameWidget(oldName: string, newName: string) {
    EditorNavigation.SelectEntityByName(oldName, EntityType.Widget);
    this.agHelper.GetNClick(this.locator._widgetName(oldName), 0, true);
    cy.get(this.locator._widgetNameTxt)
      .clear({ force: true })
      .type(newName, { force: true })
      .should("have.value", newName)
      .blur();
    this.agHelper.PressEnter(1000);
    this.assertHelper.AssertNetworkStatus("@updateWidgetName");
  }

  public CreateModal(property: string) {
    this.SelectPlatformFunction(property, "Show modal");
    this.agHelper.GetNClick(this._actionOpenDropdownSelectModal);
    this.agHelper.GetNClick(this._createModalButton);
    this.agHelper.WaitUntilEleAppear(this.locator._modal);
    this.agHelper.AssertAutoSave();
  }

  public NavigateToPage(pageName: string, property: string) {
    this.SelectPlatformFunction(property, "Navigate to");
    this.agHelper.GetNClick(this._actionOpenDropdownSelectPage);
    this.agHelper.GetNClick(this._pageName(pageName));
    this.agHelper.AssertAutoSave();
  }

  public GetSelectedItemText(property: string) {
    return this.agHelper.GetText(this._propPaneSelectedItem(property));
  }

  public SelectColorFromColorPicker(property: string, colorOffset: number) {
    this.agHelper.GetNClick(this._propertyControlColorPicker(property));
    this.agHelper.GetNClick(this._colorPickerV2Color, colorOffset, true);
  }

  public AssertPropertyVisibility(properties: string[], sectionTitle: string) {
    properties.forEach((property: string) => {
      this.agHelper.AssertElementVisibility(
        this._propertyPanePropertyControl(sectionTitle, property),
      );
    });
  }

  public SetZoomLevel(zoom: number) {
    this.agHelper.GetAttribute(this._zoomLevelInput, "value").then((value) => {
      const currentValue = Number(value?.replace("%", ""));

      if (currentValue === zoom || currentValue === 100 || currentValue === 0) {
        return;
      }
      if (zoom > currentValue) {
        this.agHelper.GetElement(this._zoomLevelControl("end")).click();
      } else if (zoom < currentValue) {
        this.agHelper.GetElement(this._zoomLevelControl("start")).click();
      }
      this.SetZoomLevel(zoom);
    });
  }

  public FocusIntoTextField(endp: string) {
    this.agHelper
      .GetElement(this.locator._propertyInputField(endp))
      .first()
      .then((el: any) => {
        cy.get(el).focus();
      });

    this.agHelper.AssertAutoSave(); //Allowing time for saving entered value
  }

  public AssertPropertySwitchState(
    propertyName: string,
    state: "enabled" | "disabled",
  ) {
    this.agHelper
      .GetElement(this._propertyToggle(propertyName))
      .should(state === "enabled" ? "be.checked" : "not.be.checked");
  }

  public ExpandIfCollapsedSection(sectionName: string) {
    cy.get(`.t--property-pane-section-collapse-${sectionName}`)
      .scrollIntoView()
      .then(($element) => {
        cy.wrap($element)
          .siblings(".bp3-collapse")
          .then(($sibling) => {
            const siblingHeight = $sibling.height(); // Get the height of the sibling element

            if (!siblingHeight) {
              $element.click();
            }
          });
      });
  }
}
