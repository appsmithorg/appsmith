export const CUSTOM_WIDGET_LOAD_EVENTS = {
  STARTED: "started",
  DOM_CONTENTED_LOADED: "DOMContentLoaded",
  COMPLETED: "completed",
};

export const getAppsmithScriptSchema = (model: Record<string, unknown>) => ({
  appsmith: {
    mode: "",
    onUiChange: Function,
    onModelChange: Function,
    updateModel: Function,
    triggerEvent: Function,
    model: model,
    ui: {
      width: 1,
      height: 2,
    },
    onReady: Function,
  },
});
