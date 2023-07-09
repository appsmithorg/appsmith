export const WIDGET = {
  INPUT_V2: "inputwidgetv2",
  TEXT: "textwidget",
  TEXTNAME: (index: string) => `Text${index}`,
  PHONE_INPUT: "phoneinputwidget",
  CURRENCY_INPUT: "currencyinputwidget",
  BUTTON: "buttonwidget",
  BUTTONNAME: (index: string) => `Button${index}`,
  CONTAINER: "containerwidget",
  MULTISELECT: "multiselectwidgetv2",
  BUTTON_GROUP: "buttongroupwidget",
  TREESELECT: "singleselecttreewidget",
  TAB: "tabswidget",
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
  PHONEINPUT: "phoneinputwidget",
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
  JSONFORM: "jsonformwidget"
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
type ValueOf<T> = T[keyof T];

export const getWidgetSelector = (widget: ValueOf<typeof WIDGET>) =>
  `.t--widget-${widget}`;
export const getWidgetInputSelector = (widget: ValueOf<typeof WIDGET>) =>
  `.t--widget-${widget} input`;
