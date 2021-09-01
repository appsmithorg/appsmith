export default [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run API on Page load",
        configProperty: "executeOnLoad",
        controlType: "SWITCH",
        info: "Will refresh data each time the page is loaded",
      },
      {
        label: "Request confirmation before running API",
        configProperty: "confirmBeforeExecute",
        controlType: "SWITCH",
        info: "Ask confirmation from the user each time before refreshing data",
      },
      {
        label: "API timeout (in milliseconds)",
        info: "Maximum time after which the API will return",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        controlType: "INPUT_TEXT",
        dataType: "NUMBER",
      },
    ],
  },
];
