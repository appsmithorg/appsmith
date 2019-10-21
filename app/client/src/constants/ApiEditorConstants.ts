export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"];

export const HTTP_METHOD_OPTIONS = HTTP_METHODS.map(method => ({
  label: method,
  value: method,
}));

export const FORM_INITIAL_VALUES = {
  resourceId: "5d808014795dc6000482bc83",
};
