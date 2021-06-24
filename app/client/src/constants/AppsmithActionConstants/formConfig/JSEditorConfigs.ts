export default [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run JS function on Page load",
        configProperty: "executeOnLoad",
        controlType: "CHECKBOX",
        info: "Will refresh data each time the page is loaded",
      },
      {
        label: "JS function timeout (in milliseconds)",
        info: "Maximum time after which the JS function will return",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        controlType: "NUMBER_INPUT",
        dataType: "number",
      },
    ],
  },
];
