export const WIDGET = {
  INPUT_WIDGET_V2: "inputwidgetv2",
  TEXT: "textwidget",
  PHONE_INPUT_WIDGET: "phoneinputwidget",
  CURRENCY_INPUT_WIDGET: "currencyinputwidget",
  BUTTON_WIDGET: "buttonwidget",
  MULTISELECT_WIDGET: "multiselectwidgetv2",
  TABLE_WIDGET_V2: "tablewidgetv2",
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
