export default [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run the API on page load",
        configProperty: "executeOnLoad",
        controlType: "SWITCH",
      },
      {
        label: "Request confirmation before running this API",
        configProperty: "confirmBeforeExecute",
        controlType: "SWITCH",
        tooltipText:
          "Ask confirmation from the user each time before refreshing data",
      },
      {
        label: "API timeout (in milliseconds)",
        subtitle: "Maximum time after which the API will return",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        controlType: "INPUT_TEXT",
        dataType: "NUMBER",
        width: "270px",
      },
    ],
  },
];
