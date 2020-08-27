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
      // {
      //   label: "Request confirmation before running query",
      //   configProperty: "requestConfirmation",
      //   controlType: "SWITCH",
      //   info: "Ask confirmation from the user everytime before refreshing data",
      // },
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
      // {
      //   label: "Request confirmation before running api",
      //   configProperty: "requestConfirmation",
      //   controlType: "SWITCH",
      //   info: "Ask confirmation from the user everytime before refreshing data",
      // },
    ],
  },
];
