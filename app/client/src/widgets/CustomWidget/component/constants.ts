export const CUSTOM_WIDGET_LOAD_EVENTS = {
  STARTED: "started",
  DOM_CONTENTED_LOADED: "DOMContentLoaded",
  COMPLETED: "completed",
};

export const getAppsmithScriptSchema = (model: Record<string, unknown>) => ({
  appsmith: {
    mode: "",
    model: model,
    ui: {
      width: 1,
      height: 2,
    },
    theme: {
      primaryColor: "",
      backgroundColor: "",
      borderRadius: "",
      boxShadow: "",
    },
    onUiChange: Function,
    onModelChange: Function,
    onThemeChange: Function,
    updateModel: Function,
    triggerEvent: Function,
    onReady: Function,
  },
});
