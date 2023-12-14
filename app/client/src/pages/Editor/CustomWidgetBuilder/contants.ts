export const CUSTOM_WIDGET_BUILDER_EVENTS = {
  READY: "READY",
  READY_ACK: "READY_ACK",
  UPDATE_SRCDOC: "UPDATE_SRCDOC",
  UPDATE_SRCDOC_ACK: "UPDATE_SRCDOC_ACK",
  UPDATE_REFERENCES: "UPDATE_REFERENCES",
  UPDATE_REFERENCES_ACK: "UPDATE_REFERENCES_ACK",
  DISCONNECTED: "DISCONNECTED",
  CLOSE: "CLOSE",
};

export const LOCAL_STORAGE_KEYS_IS_REFERENCE_OPEN =
  "custom-widget-builder-context-state-is-reference-open";

export const LOCAL_STORAGE_KEYS_SELECTED_LAYOUT =
  "custom-widget-builder-context-state-selected-layout";

export const DEFAULT_CONTEXT_VALUE = {
  name: "",
  srcDoc: {
    html: "<div>Hello World</div>",
    js: "function test() {console.log('Hello World');}",
    css: "div {color: red;}",
  },
  uncompiledSrcDoc: {
    html: "<div>Hello World</div>",
    js: "function test() {console.log('Hello World');}",
    css: "div {color: red;}",
  },
  model: {},
  events: {},
  key: Math.random(),
  isReferenceOpen: false,
  selectedLayout: "tabs",
  debuggerLogs: [],
};
