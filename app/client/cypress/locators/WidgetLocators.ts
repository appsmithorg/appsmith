export const WIDGET = {
  INPUT_V2: "inputwidgetv2",
  TEXT: "textwidget",
  TEXTNAME: (index: string) => `Text${index}`,
  PHONE_INPUT: "phoneinputwidget",
  CURRENCY_INPUT: "currencyinputwidget",
  BUTTON: "buttonwidget",
  BUTTONNAME: (index: string) => `Button${index}`,
  CODESCANNER: "codescannerwidget",
  CONTAINER: "containerwidget",
  MULTISELECT: "multiselectwidgetv2",
  BUTTON_GROUP: "buttongroupwidget",
  TREESELECT: "singleselecttreewidget",
  TAB: "tabswidget",
  TABLE_V1: "tablewidget",
  TABLE: "tablewidgetv2",
  SWITCHGROUP: "switchgroupwidget",
  SWITCH: "switchwidget",
  SELECT: "selectwidget",
  MULTITREESELECT: "multiselecttreewidget",
  RADIO_GROUP: "radiogroupwidget",
  LIST: "listwidget",
  LIST_V2: "listwidgetv2",
  RATING: "ratewidget",
  CHECKBOXGROUP: "checkboxgroupwidget",
  CHECKBOX: "checkboxwidget",
  CHART: "chartwidget",
  AUDIO: "audiowidget",
  AUDIORECORDER: "audiorecorderwidget",
  CAMERA: "camerawidget",
  FILEPICKER: "filepickerwidgetv2",
  DOCUMENT_VIEWER: "documentviewerwidget",
  VIDEO: "videowidget",
  CATEGORY_SLIDER: "categorysliderwidget",
  NUMBER_SLIDER: "numbersliderwidget",
  RANGE_SLIDER: "rangesliderwidget",
  IFRAME: "iframewidget",
  DIVIDER: "dividerwidget",
  PROGRESS: "progresswidget",
  MODAL: "modalwidget",
  FORM: "formwidget",
  ICONBUTTON: "iconbuttonwidget",
  IMAGE: "imagewidget",
  STATBOX: "statboxwidget",
  JSONFORM: "jsonformwidget",
  MENUBUTTON: "menubuttonwidget",
  DATEPICKER: "datepickerwidget2",
  MAP: "mapwidget",
  MAPCHART: "mapchartwidget",
} as const;

// property pane element selector are maintained here
export const PROPERTY_SELECTOR = {
  // input
  onClick: ".t--property-control-onclick",
  onSubmit: ".t--property-control-onsubmit",
  text: ".t--property-control-text",
  defaultValue: ".t--property-control-defaultselectedvalues",
  propertyName: ".t--property-control-propertyname",
  onClickFieldName: "onClick",
  TextFieldName: "Text",
  tableData: ".t--property-control-tabledata",
  tableColumnNames: '[data-rbd-draggable-id] input[type="text"]',
  jsToggle : '.t--js-toggle',
};

export const WIDGETSKIT = {
  recorderPrompt: "//button[@status='PERMISSION_PROMPT']",
  recorderStart: "//button[@status='DEFAULT']",
  recorderComplete: "//button[@status='COMPLETE']",
  recorderStop: ".bp3-minimal",
  video: "video",
  iFrame: "iframe",
  videoWidgetYoutubeMuteBtn: ".ytp-mute-button",
  videoWidgetYoutubeLargePlayBtn: ".ytp-large-play-button",
  videoWidgetYoutubePlayBtn: ".ytp-play-button",
  videoWidgetYoutubeVolumeBtn: ".ytp-volume-panel",
  image: "div[data-testid=styledImage]",
  imageDownloadBtn: "//a[@data-testid='t--image-download']",
  imageRotateAntiClockwiseBtn:
    "//div[contains(@class, 't--widget-imagewidget')]//a[1]",
  imageRotateClockwiseBtn:
    "//div[contains(@class, 't--widget-imagewidget')]//a[2]",
  styleResetBtn: ".reset-button",
  styleOrangeIcon: ".rounded-full",
  dividerVertical: "[data-testid=dividerVertical]",
  dividerHorizontal: "[data-testid=dividerHorizontal]",
  selectWidgetBtn: ".select-button",
  selectWidgetLabel: '//label[contains(@class,"select-label")]',
  selectWidgetLabelContainer:
    '//label[contains(@class,"select-label")]//parent::span/parent::span/parent::div',
  widgetNameTag: "span.t--widget-name",
  selectWidgetFilter: ".select-popover-wrapper .bp3-input-group input",
  selectWidgetClear: "[data-testid='selectbutton.btn.cancel']",
  selectWidgetWidthPlusBtn: ".ads-v2-input__input-section-icon-end",
  selectWidgetPlaceholder: (value: string) =>
    `//span[contains(@title,'${value}')]`,
  textWidgetLink: (link: string) => `//a[@href='${link}']`,
  textWidgetContainer: ".t--text-widget-container",
  inputWidgetLabel: ".t--input-widget-label",
  inputWidgetUnMaskPassword: '[name="eye-on"]',
  inputWidgetMaskPassword: '[name="eye-off"]',
  inputWidgetWrapper: ".text-input-wrapper",
  inputWidgetStepUp:
    "//*[contains(@class, 'bp3-icon-chevron-up')]//parent::button",
  inputWidgetStepDown:
    "//*[contains(@class, 'bp3-icon-chevron-down')]//parent::button",
  radioWidgetContainer: "[data-testid='radiogroup-container']",
  radioBtn: ".bp3-radio",
  radioWidgetLabel: ".radiogroup-label",
  radioWidgetLabelContainer:
    "[data-testid='radiogroup-container'] .label-container",
};
type ValueOf<T> = T[keyof T];

export const getWidgetSelector = (widget: ValueOf<typeof WIDGET>) =>
  `.t--widget-${widget}`;
export const getWidgetInputSelector = (widget: ValueOf<typeof WIDGET>) =>
  `.t--widget-${widget} input`;

export const modalWidgetSelector = ".t--modal-widget";

// export data-testid with user input
export const progressWidgetProgress = (input: any) =>
  `[data-testid='${input}']`;

//switch widget locators
export const switchlocators = {
  switchGroupLabel: ".switchgroup-label",
  switchTooltip:
    "//*[@data-testid='switchgroup-container']//*[@class='bp3-popover-target']",
  switchWidget: "//*[@data-testid='switchgroup-container']",
  switchWidgetHeight: (height: string) =>
    `//*[@data-testid='switchgroup-container']//div[@height="${height}"]`,
  switchGroupToggleChecked: (value: string) =>
    `//*[text()='${value}']//input[@type="checkbox"]`,
};

export const checkboxlocators = {
  checkBoxLabel: (value: string) =>
    `//*[contains(@class,'t--checkbox-widget-label') and text()='${value}']`,
};

export const datePickerlocators = {
  options: `//*[contains(@id,'rc_select_') and @role='option']`,
  input: `//*[@class='bp3-input-group']//input`,
  dayPick: `//*[contains(@class,'DayPicker-Day')]`,
  selectYear: `//*[contains(@class,'bp3-datepicker-year-select')]//select//option`,
  selectMonth: `//*[contains(@class,'bp3-datepicker-month-select')]//select//option`,
  yearCaret: `//*[contains(@class,'bp3-datepicker-year-select')]//*[contains(@class,'bp3-icon-double-caret-vertical')]`,
  monthCaret: `//*[contains(@class,'bp3-datepicker-month-select')]//*[contains(@class,'bp3-icon-double-caret-vertical')]`,
  yearInDropdown: (year: string) =>
    datePickerlocators.selectYear + `[@value='${year}']`,
  monthInDropdown: (month: string) =>
    datePickerlocators.selectMonth + `[@label='${month}']`,
  inputHour: `.bp3-timepicker-hour`,
  inputMinute: `.bp3-timepicker-minute`,
  inputSecond: `.bp3-timepicker-second`,
  weekDay: `//*[@class='DayPicker-Weekday']//*[@title]`,
  calendarHeader: `//*[contains(@class,'datepicker__calender-header')]//*[@type='button']`,
  year: (yearToSelect: string) => `//*[@data-value='${yearToSelect}']`,
  date: (dateToSelect: string) =>
    `//*[contains(@class,'datepicker__day--${dateToSelect}')]`,
};

export const buttongroupwidgetlocators = {
  buttongroup: ".t--buttongroup-widget",
  buttonSettingInPropPane: ".t--property-control-buttons .t--edit-column-btn",
  menuSettingInPropPane: ".t--edit-column-btn",
  newButton: "//*[text()='Add button']",
  groupButtonValue: "//input[contains(@value,'Group Button')]",
  buttonText: (value: string) =>
    `//*[@class="bp3-button-text" and text()='${value}']`,
  menu: "[data-value='MENU']",
  buttonMenuOptions: (text: string) =>
    `//*[contains(@class,'bp3-menu-item')]//*[text()='${text}']`,
  button: "//*[contains(@class,'t--widget-buttongroupwidget')]//button",
};

export const multiSelectWidgetLocators = {
  multiSelectWidgetTrigger: ".t--widget-multiselectwidgetv2 .rc-select-selector",
  multiSelectWidgetSelectedOptionContent: ".rc-select-selection-item > .rc-select-selection-item-content",
  multiSelectWidgetDropdownOptionCheckbox: ".multi-select-dropdown .rc-select-item-option-selected .bp3-control-indicator"
};