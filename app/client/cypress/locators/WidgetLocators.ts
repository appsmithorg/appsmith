export const WIDGET = {
  INPUT_V2: "inputwidgetv2",
  TEXT: "textwidget",
  PHONE_INPUT: "phoneinputwidget",
  CURRENCY_INPUT: "currencyinputwidget",
  BUTTON: "buttonwidget",
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
  RATING: "ratewidget",
  CHECKBOXGROUP: "checkboxgroupwidget",
  CHECKBOX: "checkboxwidget",
  AUDIO: "audiowidget",
  AUDIORECORDER: "audiorecorderwidget",
  PHONEINPUT: "phoneinputwidget",
  CAMERA: "camerawidget",
  FILEPICKER: "filepickerwidgetv2",
  DOCUMENT_VIEWER: "documentviewerwidget",
} as const;

// property pane element selector are maintained here
export const PROPERTY_SELECTOR = {
  // input
  onClick: ".t--property-control-onclick",
  onSubmit: ".t--property-control-onsubmit",
  text: ".t--property-control-text",
  defaultValue: ".t--property-control-defaultvalue",
  propertyName: ".t--property-control-propertyname",
};
type ValueOf<T> = T[keyof T];

export const getWidgetSelector = (widget: ValueOf<typeof WIDGET>) =>
  `.t--widget-${widget}`;
export const getWidgetInputSelector = (widget: ValueOf<typeof WIDGET>) =>
  `.t--widget-${widget} input`;
