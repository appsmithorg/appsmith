export default [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run the query on page load",
        configProperty: "executeOnLoad",
        controlType: "SWITCH",
      },
      {
        label: "Request confirmation before running this query",
        configProperty: "confirmBeforeExecute",
        controlType: "SWITCH",
        tooltipText:
          "Ask confirmation from the user each time before refreshing data",
      },
      {
        label: "Query timeout (in milliseconds)",
        subtitle: "Maximum time after which the query will return",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        controlType: "INPUT_TEXT",
        dataType: "NUMBER",
      },
    ],
  },
];
