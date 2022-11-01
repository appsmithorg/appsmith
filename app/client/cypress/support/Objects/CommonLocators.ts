export class CommonLocators {
  _loading = "#loading";
  _spinner = ".bp3-spinner";
  _runBtnSpinner = ".cs-spinner";
  _queryName = ".t--action-name-edit-field span";
  _queryNameTxt = ".t--action-name-edit-field input";
  _dsName = ".t--edit-datasource-name span";
  _dsNameTxt = ".t--edit-datasource-name input";
  _widgetName = (widgetName: string) =>
    ".editable-text-container:contains('" +
    widgetName +
    "') span.bp3-editable-text-content";
  _widgetNameTxt = ".editable-text-container input.bp3-editable-text-input";
  _saveStatusSuccess = ".t--save-status-success";
  _codeMirrorTextArea = ".CodeMirror textarea";
  _codeMirrorCode = ".CodeMirror-code";
  _codeEditorTargetTextArea = ".CodeEditorTarget textarea";
  _codeEditorTarget = "div.CodeEditorTarget";
  _entityExplorersearch = "#entity-explorer-search";
  _propertyControl = ".t--property-control-";
  _textWidget = ".t--draggable-textwidget span";
  _inputWidget = ".t--draggable-inputwidgetv2 input";
  _publishButton = ".t--application-publish-btn";
  _widgetInCanvas = (widgetType: string) => `.t--draggable-${widgetType}`;
  _widgetInDeployed = (widgetType: string) => `.t--widget-${widgetType}`;
  _widgetInputSelector = (widgetType: string) =>
    this._widgetInDeployed(widgetType) + " input";
  _textWidgetInDeployed = this._widgetInDeployed("textwidget") + " span";
  _inputWidgetv1InDeployed = this._widgetInDeployed("inputwidget") + " input";
  _textAreainputWidgetv1InDeployed =
    this._widgetInDeployed("inputwidget") + " textarea";
  _textAreainputWidgetv2InDeployed =
    this._widgetInDeployed("inputwidgetv2") + " textarea";
  _imageWidget = ".t--draggable-imagewidget";
  _backToEditor = ".t--back-to-editor";
  _newPage = ".pages .t--entity-add-btn";
  _toastMsg = "div.t--toast-action";
  _toastContainer = "div.Toastify__toast-container";
  _specificToast = (toastText: string) =>
    this._toastMsg + ":contains('" + toastText + "')";
  //_specificToast = (toastText: string | RegExp) => this._toastMsg + ":contains("+ (typeof toastText == 'string' ? "'"+ toastText+"'" : toastText)+ ")"//not working!
  _empty = "span[name='no-response']";
  _contextMenuInPane = "span[name='context-menu']";
  _contextMenuSubItemDiv = (item: string) =>
    "//div[text()='" + item + "'][contains(@class, 'bp3-fill')]";
  _visibleTextDiv = (divText: string) => "//div[text()='" + divText + "']";
  _visibleTextSpan = (spanText: string) => "//span[text()='" + spanText + "']";
  _openWidget = ".widgets .t--entity-add-btn";
  _dropHere = ".t--drop-target";
  _crossBtn = "span.cancel-icon";
  _createNew = ".t--entity-add-btn.group.files";
  _uploadFiles = "div.uppy-Dashboard-AddFiles input";
  _uploadBtn = "button.uppy-StatusBar-actionBtn--upload";
  _errorTab = "[data-cy=t--tab-ERROR]";
  _responseTab = "[data-cy=t--tab-response]";
  _modal = ".t--modal-widget";
  _entityProperties = (entityNameinLeftSidebar: string) =>
    "//div[text()='" +
    entityNameinLeftSidebar +
    "']/ancestor::div[contains(@class, 't--entity-item')]/following-sibling::div//div[contains(@class, 't--entity-property')]//code";
  _entityNameEditing = (entityNameinLeftSidebar: string) =>
    "//span[text()='" +
    entityNameinLeftSidebar +
    "']/parent::div[contains(@class, 't--entity-name editing')]/input";
  _jsToggle = (controlToToggle: string) =>
    ".t--property-control-" + controlToToggle + " .t--js-toggle";
  _spanButton = (btnVisibleText: string) =>
    `//span[text()="${btnVisibleText}"]/parent::button`;
  _selectPropDropdown = (ddName: string) =>
    "//div[contains(@class, 't--property-control-" +
    ddName.replace(/ +/g, "").toLowerCase() +
    "')]//button[contains(@class, 't--open-dropdown-Select-Action')]";
  _dropDownValue = (dropdownOption: string) =>
    ".single-select:contains('" + dropdownOption + "')";
  _selectOptionValue = (dropdownOption: string) =>
    ".menu-item-link:contains('" + dropdownOption + "')";
  _selectedDropdownValue =
    "//button[contains(@class, 'select-button')]/span[@class='bp3-button-text']";
  _actionTextArea = (actionName: string) =>
    "//label[text()='" +
    actionName +
    "']/following-sibling::div//div[contains(@class, 'CodeMirror')]//textarea";
  _existingDefaultTextInput =
    ".t--property-control-defaulttext .CodeMirror-code";
  _widgetPageIcon = (widgetType: string) =>
    `.t--widget-card-draggable-${widgetType}`;
  _propertyToggleValue = (controlToToggle: string) =>
    "//div[contains(@class, 't--property-control-" +
    controlToToggle +
    "')]//input[@type='checkbox']/parent::label";
  _openNavigationTab = (tabToOpen: string) => `#switcher--${tabToOpen}`;
  _selectWidgetDropdown = (widgetType: string) =>
    `//div[contains(@class, 't--draggable-${widgetType}')]//button`;
  _selectWidgetDropdownInDeployed = (widgetType: string) =>
    `//div[contains(@class, 't--widget-${widgetType}')]//button`;
  _inputFieldByName = (fieldName: string) =>
    "//p[text()='" +
    fieldName +
    "']/ancestor::div[@class='form-config-top']/following-sibling::div";
  _existingFieldTextByName = (fieldName: string) =>
    "//label[text()='" +
    fieldName +
    "']/ancestor::div[contains(@class, 't--property-control-" +
    fieldName.replace(/ +/g, "").toLowerCase() +
    "')]";
  _existingFieldValueByName = (fieldName: string) =>
    this._existingFieldTextByName(fieldName) +
    "//div[contains(@class,'CodeMirror-code')]";
  _existingActualValueByName = (fieldName: string) =>
    this._existingFieldValueByName(fieldName) + "//span/span";
  _codeMirrorValue = "//div[contains(@class,'CodeMirror-code')]//span/span";
  _evaluatedCurrentValue =
    "div:last-of-type .t--CodeEditor-evaluatedValue > div:last-of-type pre";
  _evaluatedErrorMessage =
    ".t--CodeEditor-evaluatedValue .t--evaluatedPopup-error";
  _multiSelectOptions = (option: string) =>
    "div[title='" + option + "'] input[type='checkbox']";
  _divWithClass = (className: string) =>
    "//div[contains(@class, '" + className + "')]";
  _multiSelectItem = (item: string) =>
    "//span[text()='" +
    item +
    "']/ancestor::div[@class ='rc-select-selection-overflow-item']//span[contains(@class, 'remove-icon')]";
  _listWidget = "div[type='LIST_WIDGET']";
  _dropdownText = ".t--dropdown-option";
  _jsonFormInputField = (fieldName: string) =>
    `.t--jsonformfield-${fieldName} input`;
  _jsonFormHeader = ".t--jsonform-body > div:first-child";
  _jsonFormWidget = ".t--widget-jsonformwidget";
  _lintErrorElement = `span.CodeMirror-lint-mark-error`;
  _lintWarningElement = "span.CodeMirror-lint-mark-warning";
  _codeEditorWrapper = ".unfocused-code-editor";
  _datePicker = (date: number) =>
    "(//div[@class ='bp3-datepicker']//div[contains(@class, 'DayPicker-Day')]//div[text()='" +
    date +
    "'])[last()]";
  _inputWidgetValueField = (fieldName: string, input = true) =>
    `//label[contains(@class, 't--input-widget-label')][text()='${fieldName}']/ancestor::div[@data-testid='input-container']//${
      input ? "input" : "textarea"
    }`;
  _deleteIcon = "button .bp3-icon-delete";
  _datePickerValue = "div[data-testid='datepicker-container'] input";
  _switchToggle = (switchName: string) =>
    "//div[contains(@class, 't--switch-widget-label')][text()='" +
    switchName +
    "']/parent::label/span";
  _jsonToggle = (fieldName: string) =>
    `//p[text()='${fieldName}']/parent::div//following-sibling::div//input[@type='checkbox']`;
  _deployedPage = `.t--page-switch-tab`;
  _hints = "ul.CodeMirror-hints li";
  _cancelActionExecution = ".t--cancel-action-button";
  _widgetPane = "[data-cy='widget-sidebar-scrollable-wrapper']";
  _sliderThumb = '[data-cy="slider-thumb"]';
  _bottomPaneCollapseIcon = ".t--tabs-collapse-icon";
  _dropDownMultiTreeValue = (dropdownOption: string) =>
    "//span[@class='rc-tree-select-tree-title']/parent::span[@title='" +
    dropdownOption +
    "']";
  _dropDownMultiTreeSelect = ".rc-tree-select-multiple";
}
