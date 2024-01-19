export const CUSTOM_WIDGET_BUILDER_EVENTS = {
  READY: "READY",
  READY_ACK: "READY_ACK",
  UPDATE_SRCDOC: "UPDATE_SRCDOC",
  UPDATE_SRCDOC_ACK: "UPDATE_SRCDOC_ACK",
  UPDATE_REFERENCES: "UPDATE_REFERENCES",
  UPDATE_REFERENCES_ACK: "UPDATE_REFERENCES_ACK",
  PAUSE: "PAUSE",
  RESUME: "RESUME",
  DISCONNECTED: "DISCONNECTED",
  CLOSE: "CLOSE",
};

export const LOCAL_STORAGE_KEYS_IS_REFERENCE_OPEN =
  "custom-widget-builder-context-state-is-reference-open";

export const LOCAL_STORAGE_KEYS_SELECTED_LAYOUT =
  "custom-widget-builder-context-state-selected-layout";

export const DEFAULT_CONTEXT_VALUE = {
  name: "",
  widgetId: "",
  srcDoc: {
    html: "",
    js: "",
    css: "",
  },
  uncompiledSrcDoc: {
    html: "",
    js: "",
    css: "",
  },
  model: {},
  events: {},
  key: Math.random(),
  isReferenceOpen: false,
  selectedLayout: "tabs",
  debuggerLogs: [],
  showConnectionLostMessage: false,
  theme: {
    colors: {
      primaryColor: "",
      backgroundColor: "",
    },
    borderRadius: {
      appBorderRadius: "",
    },
    boxShadow: {
      appBoxShadow: "",
    },
    fontFamily: {
      appFontFamily: "",
    },
  },
};

export const CUSTOM_WIDGET_DOC_URL =
  "https://docs.appsmith.com/reference/widgets/custom";

export const CUSTOM_WIDGET_DEFAULT_MODEL_DOC_URL =
  "https://docs.appsmith.com/reference/widgets/custom#default-model";

export const CUSTOM_WIDGET_ONREADY_DOC_URL =
  "https://docs.appsmith.com/reference/widgets/custom#onready";
