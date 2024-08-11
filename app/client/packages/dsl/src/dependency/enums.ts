export enum APPSMITH_GLOBAL_FUNCTIONS {
  navigateTo = "navigateTo",
  showAlert = "showAlert",
  showModal = "showModal",
  closeModal = "closeModal",
  storeValue = "storeValue",
  removeValue = "removeValue",
  clearStore = "clearStore",
  download = "download",
  copyToClipboard = "copyToClipboard",
  resetWidget = "resetWidget",
  setInterval = "setInterval",
  clearInterval = "clearInterval",
  postWindowMessage = "postWindowMessage",
}

export enum APPSMITH_NAMESPACED_FUNCTIONS {
  getGeolocation = "appsmith.geolocation.getCurrentPosition",
  watchGeolocation = "appsmith.geolocation.watchPosition",
  stopWatchGeolocation = "appsmith.geolocation.clearWatch",
}

export enum EvaluationSubstitutionType {
  TEMPLATE = "TEMPLATE",
  PARAMETER = "PARAMETER",
  SMART_SUBSTITUTE = "SMART_SUBSTITUTE",
}

export enum EvalErrorTypes {
  CYCLICAL_DEPENDENCY_ERROR = "CYCLICAL_DEPENDENCY_ERROR",
  EVAL_PROPERTY_ERROR = "EVAL_PROPERTY_ERROR",
  EVAL_TREE_ERROR = "EVAL_TREE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  BAD_UNEVAL_TREE_ERROR = "BAD_UNEVAL_TREE_ERROR",
  PARSE_JS_ERROR = "PARSE_JS_ERROR",
  EXTRACT_DEPENDENCY_ERROR = "EXTRACT_DEPENDENCY_ERROR",
  CLONE_ERROR = "CLONE_ERROR",
  SERIALIZATION_ERROR = "SERIALIZATION_ERROR",
}
