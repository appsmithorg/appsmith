export const CUSTOM_WIDGET_LOAD_EVENTS = {
  STARTED: "started",
  DOM_CONTENTED_LOADED: "DOMContentLoaded",
  COMPLETED: "completed",
};

export const getAppsmithScriptSchema = (model: Record<string, unknown>) => ({
  appsmith: {
    mode: "",
    model: model,
    onUiChange: Function,
    onModelChange: Function,
    onThemeChange: Function,
    updateModel: Function,
    triggerEvent: Function,
    onReady: Function,
  },
});
