export class CommonLocators {
  _body = "body";
  _inputField = "input";
  _canvasViewport = "#canvas-viewport";
  _emptyPageTxt = ".bp3-heading";
  _chevronUp = ".bp3-icon-chevron-up";
  _loading = "#loading";
  _animationSpnner = ".bp3-spinner-animation";
  _btnSpinner = ".ads-v2-spinner";
  _sidebar = ".t--sidebar";
  _queryName = ".t--action-name-edit-field span";
  _queryNameTxt = ".t--action-name-edit-field input";
  _emptyCanvasCta = "[data-testid='canvas-ctas']";
  _dsName = ".t--edit-datasource-name span";
  _dsNameTxt = ".t--edit-datasource-name input";
  _widgetName = (widgetName: string) =>
    ".editable-text-container:contains('" +
    widgetName +
    "') span.bp3-editable-text-content";
  _widgetNameTxt = ".editable-text-container input.bp3-editable-text-input";
  _widgetByName = (widgetName: string) =>
    `[data-widgetname-cy="${widgetName}"]`;
  _saveStatusContainer = ".t--save-status-container";
  _statusSaving = ".t--save-status-is-saving";
  _saveStatusError = ".t--save-status-error";
  _codeMirrorTextArea = ".CodeMirror textarea";
  _codeMirrorCode = ".CodeMirror-code";
  _codeEditorTargetTextArea = ".CodeEditorTarget textarea";
  _codeEditorTarget = "div.CodeEditorTarget";
  _entityExplorersearch = "#entity-explorer-search";
  _propertyControl = ".t--property-control-";
  _propertyControlTextArea = (uiName: string) =>
    this._propertyControl +
    uiName.replace(/ +/g, "").toLowerCase() +
    " " +
    this._codeMirrorTextArea;
  _propertyControlInput = (uiName: string) =>
    this._propertyControl +
    uiName.replace(/ +/g, "").toLowerCase() +
    " " +
    this._inputField;
  _propertyInputField = (uiName: string) =>
    `${this._propertyControlTextArea(uiName)}, ${this._propertyControlInput(
      uiName,
    )}`;
  _textWidget = ".t--draggable-textwidget .t--text-widget-container span";
  _inputWidget = ".t--draggable-inputwidgetv2 input";
  _publishButton = ".t--application-publish-btn";
  _widgetInCanvas = (widgetType: string) => `.t--draggable-${widgetType}`;
  _widgetInDeployed = (widgetType: string) => `.t--widget-${widgetType}`;
  _widgetInputSelector = (widgetType: string) =>
    this._widgetInDeployed(widgetType) + " input";
  _textWidgetInDeployed = this._widgetInDeployed("textwidget") + " span";
  _textWidgetStyleInDeployed =
    this._widgetInDeployed("textwidget") + " .bp3-ui-text";
  _inputWidgetv1InDeployed = this._widgetInDeployed("inputwidget") + " input";
  _textAreainputWidgetv1InDeployed =
    this._widgetInDeployed("inputwidget") + " textarea";
  _textAreainputWidgetv2InDeployed =
    this._widgetInDeployed("inputwidgetv2") + " textarea";
  _imageWidget = ".t--draggable-imagewidget";
  _backToEditor = ".t--back-to-editor";
  _newPage = ".pages .t--entity-add-btn";
  _toastMsg = "div.Toastify__toast";
  _toastContainer = "div.Toastify__toast-container";
  _specificToast = (toastText: string) =>
    this._toastMsg + ":contains('" + toastText + "')";
  //_specificToast = (toastText: string | RegExp) => this._toastMsg + ":contains("+ (typeof toastText == 'string' ? "'"+ toastText+"'" : toastText)+ ")"//not working!
  _empty = "span[name='no-response']";
  _contextMenuInPane = "[data-testid='more-action-trigger']";
  _contextMenuItem = (item: string) =>
    "//span[text()='" +
    item +
    "']/parent::div[@role='menuitem'] | //div[text()='" +
    item +
    "']/ancestor::div[@role='menuitem'] | //span[text()='" +
    item +
    "']/ancestor::div[@role='menuitem']";
  _visibleTextDiv = (divText: string) => "//div[text()='" + divText + "']";
  _visibleTextSpan = (spanText: string) => `//span[text()="` + spanText + `"]`;
  _openWidget = ".widgets .t--entity-add-btn";
  _dropHere = ".t--drop-target";
  _editPage = "[data-testid=onboarding-tasks-datasource-text], .t--drop-target";
  _crossBtn = "span.cancel-icon";
  _createNew = ".t--entity-add-btn.group.files button";
  _uploadFiles = "div.uppy-Dashboard-AddFiles input";
  _uploadBtn = "button.uppy-StatusBar-actionBtn--upload";
  _errorTab = "[data-testid=t--tab-ERROR]";
  _responseTab = "[data-testid=t--tab-response]";
  _modal = ".t--modal-widget";
  _closeModal = "button:contains('Close')";
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
    `//span[text()="${btnVisibleText}"]/ancestor::button`;
  _selectPropPageDropdown = (ddName: string) =>
    "//div[contains(@class, 't--property-control-" +
    ddName.replace(/ +/g, "").toLowerCase() +
    "')]//button[contains(@class, 't--open-dropdown-Select-Page')]";
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
    controlToToggle.replace(/ +/g, "").toLowerCase() +
    "')]//input[@type='checkbox']/parent::label";
  _openNavigationTab = (tabToOpen: string) =>
    `//span[text()='${tabToOpen}']/ancestor::div`;
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
    "')] | //label[text()='" +
    fieldName +
    "']/following-sibling::div";
  _existingFieldValueByName = (fieldName: string) =>
    this._existingFieldTextByName(fieldName) +
    "//div[contains(@class,'CodeMirror-code')]";
  _existingActualValueByName = (fieldName: string) =>
    this._existingFieldValueByName(fieldName) + "//span/span";
  _codeMirrorValue = "//div[contains(@class,'CodeMirror-code')]//span/span";
  _evaluatedCurrentValue =
    "div:last-of-type .t--CodeEditor-evaluatedValue > div:last-of-type pre";
  _evaluatedValuePopDragHandler = ".drag-handle-block";
  _evaluatedErrorMessage =
    ".t--CodeEditor-evaluatedValue .t--evaluatedPopup-error";
  _evalPopup = ".evaluated-value-popup";
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
  _confirmationdialogbtn = (btnText: string) =>
    `//div[@data-testid='t--query-run-confirmation-modal']//span[text()='${btnText}']`;
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
  _widgetPane = "[data-testid='widget-sidebar-scrollable-wrapper']";
  _sliderThumb = '[data-testid="slider-thumb"]';
  _optionsJsToggle = ".t--property-control-options .t--js-toggle";
  _bottomPaneCollapseIcon = ".t--tabs-collapse-icon";
  _dropDownMultiTreeValue = (dropdownOption: string) =>
    "//span[@class='rc-tree-select-tree-title']/parent::span[@title='" +
    dropdownOption +
    "']";
  _dropDownMultiTreeSelect = ".rc-tree-select-multiple";
  _omnibarDescription = "[data-testid='description']";
  _previewModeToggle = (currentMode: "preview" | "edit") =>
    `[data-testid='${currentMode}-mode']`;
  _editModeToggle = ".t--switch-comment-mode-off";
  _editorVariable = ".cm-variable";
  _consoleString = ".cm-string";
  _commentString = ".cm-comment";
  _modalWrapper = "[data-testid='modal-wrapper']";
  _editorBackButton = ".t--close-editor";
  _dialogCloseButton = ".ads-v2-modal__content-header-close-button";
  _evaluateMsg = ".t--evaluatedPopup-error";
  _canvas = "[data-testid=widgets-editor]";
  _enterPreviewMode = "[data-testid='edit-mode']";
  _exitPreviewMode = "[data-testid='preview-mode']";
  _ds_imageSelector = ".ads-dialog-trigger";
  _ds_imageSelector_label = ".ads-dialog-trigger .label";
  _ds_uppy_fileInput = ".uppy-Dashboard-input";
  _ds_uppy_crop_confirm = ".uppy-ImageCropper-controls .uppy-c-btn";
  _ds_uppy_upload_btn = ".uppy-StatusBar-actionBtn--upload";

  _goBack = this._visibleTextSpan("Back") + "/parent::a";
  _learnMore = this._visibleTextSpan("Learn more") + "/parent::a";
  _resizeHandles = {
    left: "t--resizable-handle-LEFT",
    right: "t--resizable-handle-RIGHT",
    bottom: "t--resizable-handle-BOTTOM",
    bottomLeft: "t--resizable-handle-BOTTOM|LEFT",
    bottomRight: "t--resizable-handle-BOTTOM|RIGHT",
  };
  _popUpCloseBtn = (popupname: string) =>
    `//*[text()='${popupname}']/following-sibling::button`;
  _selectByValue = (value: string) =>
    `//button[contains(@class, 't--open-dropdown-${value}')]`;
  _fixedLayout = "#t--layout-conversion-cta:contains('fixed')";
  _forkAppToWorkspaceBtn = ".t--fork-app-to-workspace-button";
  _errorToolTip = ".bp3-popover-content";
  _selectedWidget = "div[data-testid='t--selected']";
  _appsmithWidget = (widgetId: string) => `.appsmith_widget_${widgetId}`;
  _selectionCanvas = (canvasId: string) => `#div-selection-${canvasId}`;
  _sqlKeyword = ".cm-m-sql.cm-keyword";
  _appLeveltooltip = (toolTip: string) => `span:contains('${toolTip}')`;
  _appEditMenu = "[data-testid='t--application-edit-menu']";
  _appEditMenuBtn = "[data-testid='t--application-edit-menu-cta']";
  _appEditMenuSettings = "[data-testid='t--application-edit-menu-settings']";
  _appThemeSettings = "#t--theme-settings-header";
  _appChangeThemeBtn = ".t--change-theme-btn";
  _appThemeCard = ".t--theme-card";
  _gitStatusChanges = "[data-testid='t--git-change-statuses']";
  _appNavigationSettings = "#t--navigation-settings-header";
  _appNavigationSettingsShowTitle = "#t--navigation-settings-application-title";
  _switchGroupControl =
    ".t--draggable-switchgroupwidget .bp3-control-indicator";
  _fontSelect = "fontsize .rc-select";
  _fontInput = "fontsize input";
  _pagination = ".rc-pagination";
  _controlOption = ".t--property-control-options";
  _canvasBody = "[data-testid='div-selection-0']";
}
