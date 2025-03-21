export class CommonLocators {
  _body = "body";
  _inputField = "input";
  _canvasViewport = "#canvas-viewport";
  _emptyPageTxt = ".bp3-heading";
  _chevronUp = "span[contains(@class, 'bp3-icon-chevron-up')]";
  _chevronDown = "span[contains(@class, 'bp3-icon-chevron-down')]";
  _loading = "#loading";
  _animationSpnner = ".bp3-spinner-animation";
  _link = ".ads-v2-link";
  _btnSpinner = ".ads-v2-spinner";
  _sidebar = ".t--sidebar";
  _activeEntityTab = ".editor-tab.active .ads-v2-text";
  _activeEntityTabInput = ".editor-tab.active .ads-v2-text input";
  _editIcon = ".t--action-name-edit-icon";
  _emptyCanvasCta = "[data-testid='canvas-ctas']";
  _dsName = ".t--edit-datasource-name span";
  _dsNameTxt = ".t--edit-datasource-name input";
  _tableRecordsContainer = ".show-page-items";
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
  _tableWidget = ".t--widget-tablewidgetv2";
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
  _toastMsg = "div.Toastify__toast";
  _toastContainer = "div.Toastify__toast-container";
  _specificToast = (toastText: string) =>
    this._toastMsg + ":contains('" + toastText + "')";
  //_specificToast = (toastText: string | RegExp) => this._toastMsg + ":contains("+ (typeof toastText == 'string' ? "'"+ toastText+"'" : toastText)+ ")"//not working!
  _empty = "span[name='no-response']";
  _contextMenuInPane = "[data-testid='t--more-action-trigger']";
  _contextMenuItem = (item: string) =>
    "//span[text()='" +
    item +
    "']/parent::div[@role='menuitem'] | //div[text()='" +
    item +
    "']/ancestor::div[@role='menuitem'] | //span[text()='" +
    item +
    "']/ancestor::div[@role='menuitem']";
  _visibleTextDiv = (divText: string) => "//div[text()='" + divText + "']";
  _visibleTextSpan = (spanText: string, isCss = false) =>
    isCss ? `span:contains("${spanText}")` : `//span[text()="${spanText}"]`;
  _dropHere = ".t--drop-target";
  _anvilDnDHighlight = "[data-type=anvil-dnd-highlight]";
  _editPage = "[data-testid=onboarding-tasks-datasource-text], .t--drop-target";
  _crossBtn = "span.cancel-icon";
  _createNew = "[data-testid='t--add-item']";
  _uploadFiles = "div.uppy-Dashboard-AddFiles input";
  _uploadBtn = "button.uppy-StatusBar-actionBtn--upload";
  _errorTab = "[data-testid=t--tab-ERROR_TAB]";
  _responseTab = "[data-testid=t--tab-RESPONSE_TAB]";
  _modal = ".t--modal-widget";
  _closeModal = "button:contains('Close')";
  _entityProperties = (entityNameinLeftSidebar: string) =>
    "//div[text()='" +
    entityNameinLeftSidebar +
    "']/ancestor::div[contains(@class, 't--entity-item')]/following-sibling::div//div[contains(@class, 't--entity-property')]//code";
  _entityNameEditing = ".t--entity-name.editing input";
  _jsToggle = (controlToToggle: string) =>
    `.t--property-control-${controlToToggle} .t--js-toggle, [data-guided-tour-iid='${controlToToggle}']`;
  _buttonByText = (btnVisibleText: string) =>
    `//span[text()="${btnVisibleText}"]/ancestor::button | //button[text()="${btnVisibleText}" or @title="${btnVisibleText}"]`;
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
    "']/following-sibling::div//div[contains(@class, 'CodeMirror')]//textarea | //label[text()='" +
    actionName +
    "']/parent::div/following-sibling::div//div[contains(@class, 'CodeMirror')]//textarea";
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
    "']/following-sibling::div | //label[text()='" +
    fieldName +
    "']/parent::div/following-sibling::div";
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
  _checkboxTypeByOption = (option: string) =>
    "//div[contains(text(),'" +
    option +
    "')]/parent::label/input | //label[contains(text(),'" +
    option +
    "')]/input";
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
  _hints_apis = "ul.CodeMirror-hints li.Codemirror-commands-apis";
  _tern_doc = ".t--tern-doc";
  _argHintFnName = ".CodeMirror-Tern-tooltip .CodeMirror-Tern-fname";
  _cancelActionExecution = ".t--cancel-action-button";
  _widgetPane = "[data-testid='t--widget-sidebar-scrollable-wrapper']";
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
  _dialogCloseButton = ".ads-v2-modal__content-header-close-button";
  _evaluateMsg = ".t--evaluatedPopup-error";
  _evalValuePopover = ".t--CodeEditor-evaluatedValue";
  _canvas = "[data-testid=t--widgets-editor]";
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
  _popoverToolTip = ".bp3-popover-content, .bp3-popover2-content";
  _autoLayoutSelectedWidget = "div[data-testid='t--selected']";
  _appsmithWidget = (widgetId: string) => `.appsmith_widget_${widgetId}`;
  _selectionCanvas = (canvasId: string) => `#div-selection-${canvasId}`;
  _sqlKeyword = ".cm-m-sql.cm-keyword";
  _appLeveltooltip = (toolTip: string) => `span:contains('${toolTip}')`;
  _appEditMenu = "[data-testid='t--editor-menu']";
  _appEditMenuBtn = "[data-testid='t--editor-menu-cta']";
  _appEditExportSettings = "[data-testid='t--editor-menu-export-application']";
  _appThemeSettings = "#t--theme-settings-header";
  _appChangeThemeBtn = ".t--change-theme-btn";
  _appThemeCard = ".t--theme-card";
  _appNavigationSettings = "#t--navigation-settings-header";
  _appNavigationSettingsShowTitle = "#t--navigation-settings-application-title";
  _fontSelect = "fontsize .rc-select";
  _fontInput = "fontsize input";
  _pagination = ".rc-pagination";
  _controlOption = ".t--property-control-options";
  _canvasBody = "[data-testid='div-selection-0']";
  _itemContainerWidget = ".t--widget-containerwidget div.style-container";
  _adsV2Content = ".ads-v2__content";
  _adsV2CollapsibleHeader = ".ads-v2-collapsible__header";
  _adsV2Text = ".ads-v2-text";
  _svg = "svg";
  _imgWidgetInsideList = `//div[@data-testid='styledImage']//img`;
  _containerWidget = "[type='CONTAINER_WIDGET']";
  _statboxWidget = "[type='STATBOX_WIDGET']";
  _evaluatedValue = ".t-property-evaluated-value";
  public ds_editor_env_filter = (envName: string) =>
    `[data-testid="t--ds-data-filter-${envName}"]`;
  _textWidgetContaioner = ".t--text-widget-container span";
  _label = ".bp3-label";
  _input = ".bp3-input";
  _tooltipIcon = ".bp3-popover-target svg";
  _checkboxHelpIcon = ".bp3-popover-target svg";
  _checkboxWidgetLabel = ".t--checkbox-widget-label";
  _buttonWidgetInForm =
    "//*[contains(@class,'t--widget-buttonwidget')]//button[contains(@class,'bp3-button')]";
  _walkthrough_overlay = `.t--walkthrough-overlay`;
  _autoHeightOverlay = "[data-testid='t--auto-height-overlay']";
  _autoHeightHandles = "[data-testid='t-auto-height-overlay-handles']";
  _autoHeightMin = "[data-testid='t--auto-height-overlay-handles-min']";
  _autoHeightMax = "[data-testid='t--auto-height-overlay-handles-max']";
  _position = (value: string) => `//*[@data-value='${value}']`;
  _alignment = (value: string) => `//*[@data-value='${value}']`;
  _borderRadius = (value: string) => `//*[@data-value='${value}']`;
  _textInside = ".bp3-ui-text span";
  _listActivePage = ".t--widget-listwidgetv2 .rc-pagination-item-active";
  _hintsList = "ul.CodeMirror-hints";
  _buttonInDeployedMode = ".bp3-button";
  _treeSelectPlaceholder = ".rc-tree-select-selection-placeholder";
  _treeSelectTitle = ".rc-tree-select-tree-title";
  _callbackAddBtn = ".action-callback-add .ads-v2-button";
  _checkboxInDeployedMode = "//label[contains(@class, 'bp3-checkbox')]//input";
  _listText = "//span[text()='Blue']/../..";
  _jsonFormSubmitBtn = ".t--jsonform-submit-btn";
  _jsonFormResetBtn = ".t--jsonform-reset-btn";
  _draggableFieldConfig = (fieldName: string) =>
    `[data-rbd-draggable-id=${fieldName}]`;
  _fileUploadDashboardClose = ".uppy-Dashboard-close";
  _fileUploadErrorContains = (msg: string) =>
    `.uppy-Informer p:contains('${msg}')`;
  _fileUploadAddMore = ".uppy-DashboardContent-addMore";
  _buttonText = ".bp3-button-text";
  _richText_TitleBlock = "[aria-label='Block Paragraph']";
  _richText_Heading = "[aria-label='Heading 1']";
  _richText_Label_Text = ".tox-tbtn__select-label";
  _richText_Text_Color = (color: string) =>
    `[aria-label="Text color ${color}"] .tox-split-button__chevron`;
  _richText_color = (value: string) => `[aria-label="${value}"]`;
  _richText_line = "#tinymce p span";
  _treeSelectedContent = ".rc-tree-select-selection-item-content";
  _switcherIcon = ".switcher-icon";
  _root = "#root";
  _pageHeaderToggle = ".navbar__items > button";
  _pageHeaderMenuList = ".navbar-sidebar__backdrop";
  _enterFullScreen = ".application-demo-new-dashboard-control-enter-fullscreen";
  _dashboardContainer = ".application-demo-new-dashboard-container";
  _exitFullScreen = ".application-demo-new-dashboard-control-exit-fullscreen";
  _menuItem = ".bp3-menu-item";
  _slashCommandHintText = ".slash-command-hint-text";
  errorPageTitle = ".t--error-page-title";
  errorPageDescription = ".t--error-page-description";
  _moduleInstanceEntity = (module: string) =>
    `[data-testid=t--entity-item-${module}1]`;
  _codeEditor = "[data-testid=code-editor-target]";
  _selectionItem = ".rc-select-selection-item";
  _moduleInputEntity = (inputName: string) =>
    `[data-testid=t--module-instance-input-field-wrapper-${inputName}]`;
  _selectClearButton_testId = "selectbutton.btn.cancel";
  _selectClearButton_dataTestId = `[data-testid="${this._selectClearButton_testId}"]`;
  _saveDatasource = `[data-testid='t--store-as-datasource']`;
  _propertyCollapseBody = ".bp3-collapse-body";
  _propertyCollapse = ".bp3-collapse";
  _widgetBorder = ".t--draggable-tabswidget div div div";
  _modalButtonText = "[data-testid='modal-wrapper'] .bp3-button";
  _showBoundary = ".show-boundary";
  _entityItem = "[data-testid='t--entity-item-Api1']";
  _rowData = "[data-colindex='0'][data-rowindex='0']";
  _visualNonIdeaState = ".bp3-non-ideal-state";
  _editorTab = ".editor-tab";
  _entityTestId = (entity: string) =>
    `[data-testid="t--entity-item-${entity}"]`;
  _listItemTitle = ".ads-v2-listitem__title";
  _dropdownOption = ".rc-select-item-option-content";
  _dropdownActiveOption = ".rc-select-dropdown .rc-select-item-option-active";
  _homeIcon = "[data-testid='t--default-home-icon']";
  _widget = (widgetName: string) => `.t--widget-${widgetName}`;
}
