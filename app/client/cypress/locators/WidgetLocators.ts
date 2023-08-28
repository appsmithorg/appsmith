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
    "//a[@data-testid='t--image-download']//parent::div/a[1]",
  imageRotateClockwiseBtn:
    "//a[@data-testid='t--image-download']//parent::div/a[2]",
  styleResetBtn: ".reset-button",
  styleOrangeIcon: ".rounded-full",
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
  // read Blue here
  checkBoxLabel: (value: string) =>
    `//*[contains(@class,'t--checkbox-widget-label') and text()='${value}']`,
};
