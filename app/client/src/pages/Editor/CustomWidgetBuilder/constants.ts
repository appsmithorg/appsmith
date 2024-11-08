export const CUSTOM_WIDGET_BUILDER_EVENTS = {
  READY: "READY",
  READY_ACK: "READY_ACK",
  UPDATE_SRCDOC: "UPDATE_SRCDOC",
  UPDATE_REFERENCES: "UPDATE_REFERENCES",
  UPDATE_REFERENCES_ACK: "UPDATE_REFERENCES_ACK",
  PAUSE: "PAUSE",
  RESUME: "RESUME",
  DISCONNECTED: "DISCONNECTED",
  CLOSE: "CLOSE",
};

export const LOCAL_STORAGE_KEYS_IS_REFERENCE_OPEN =
  "custom-widget-builder-context-state-is-reference-open";

export const DEFAULT_CONTEXT_VALUE = {
  name: "",
  widgetId: "",
  parentEntityId: "",
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

export const CUSTOM_WIDGET_DEFAULT_MODEL_DOC_URL = `${CUSTOM_WIDGET_DOC_URL}#default-model`;

export const CUSTOM_WIDGET_ONREADY_DOC_URL = `${CUSTOM_WIDGET_DOC_URL}#onready`;

export const CUSTOM_WIDGET_HEIGHT_DOC_URL = `${CUSTOM_WIDGET_DOC_URL}#height`;

export const CUSTOM_WIDGET_AI_CHAT_TYPE = "CUSTOM_WIDGET";

export const CUSTOM_WIDGET_AI_INITIALISED_MESSAGE = "CHAT_INITIALISED";

export const CUSTOM_WIDGET_AI_BOT_URL = (instanceId: string) =>
  `https://internal.appsmith.com/app/app-builder-bot/custom-widget-bot-672b2020d37b7d0b29dcfa71?embed=true&chatType=${CUSTOM_WIDGET_AI_CHAT_TYPE}&chatInstance=${instanceId}&url=${encodeURIComponent(window.location.origin)}`;
