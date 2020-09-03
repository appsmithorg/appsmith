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
        configProperty: "confirmBeforeExecute",
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
        dataType: "NUMBER",
      },
      {
        label: "Query Timeout (in milliseconds)",
        configProperty: "actionConfiguration.timeoutInMillisecond.",
        controlType: "INPUT_TEXT",
        dataType: "NUMBER",
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
        configProperty: "confirmBeforeExecute",
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
        dataType: "NUMBER",
      },
      {
        label: "Api Timeout (in milliseconds)",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        controlType: "INPUT_TEXT",
        dataType: "NUMBER",
      },
    ],
  },
];
