export const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE"];

export const HTTP_METHOD_OPTIONS = HTTP_METHODS.map(method => ({
  label: method,
  value: method,
}));

export const FORM_INITIAL_VALUES = {
  actionConfiguration: {
    headers: [
      {
        key: "",
        value: "",
      },
      {
        key: "",
        value: "",
      },
    ],
    queryParameters: [
      {
        key: "",
        value: "",
      },
      {
        key: "",
        value: "",
      },
    ],
  },
};

export const REST_PLUGIN_ID = "5ca385dc81b37f0004b4db85";
