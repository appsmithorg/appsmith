export const queryActionSettingsConfig = [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run query on Page load",
        configProperty: "executeOnLoad",
        controlType: "SWITCH",
        info: "Will refresh data everytime page is reloaded",
      },
      {
        label: "Request confirmation before running query",
        configProperty: "requestConfirmation",
        controlType: "SWITCH",
        info: "Ask confirmation from the user everytime before refreshing data",
      },
      {
        label: "Cache response",
        configProperty: "shouldCacheResponse",
        controlType: "SWITCH",
      },
      {
        label: "Cache timeout (in milliseconds)",
        configProperty: "cacheTimeout",
        controlType: "INPUT_TEXT",
      },
      {
        label: "Query Timeout (in milliseconds)",
        configProperty: "actionConfiguration.timeoutInMillisecond.",
        controlType: "INPUT_TEXT",
      },
    ],
  },
];

export const apiActionSettingsConfig = [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run api on Page load",
        configProperty: "executeOnLoad",
        controlType: "SWITCH",
        info: "Will refresh data everytime page is reloaded",
      },
      {
        label: "Request confirmation before running api",
        configProperty: "requestConfirmation",
        controlType: "SWITCH",
        info: "Ask confirmation from the user everytime before refreshing data",
      },
      {
        label: "Cache response",
        configProperty: "shouldCacheResponse",
        controlType: "SWITCH",
      },
      {
        label: "Cache timeout (in milliseconds)",
        configProperty: "cacheTimeout",
        controlType: "INPUT_TEXT",
      },
      {
        label: "Api Timeout (in milliseconds)",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        controlType: "INPUT_TEXT",
      },
    ],
  },
];
