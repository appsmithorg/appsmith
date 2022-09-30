export default [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Run API on Page load",
        configProperty: "executeOnLoad",
        controlType: "SWITCH",
        subtitle: "Will refresh data each time the page is loaded",
      },
      {
        label: "Request confirmation before running API",
        configProperty: "confirmBeforeExecute",
        controlType: "SWITCH",
        subtitle:
          "Ask confirmation from the user each time before refreshing data",
      },
      {
        label: "Encode query params",
        configProperty: "actionConfiguration.encodeParamsToggle",
        controlType: "SWITCH",
        subtitle:
          "Encode query params for all APIs. Also encode form body when Content-Type header is set to x-www-form-encoded",
      },
      {
        label: "Smart JSON Substitution",
        configProperty: "actionConfiguration.pluginSpecifiedTemplates[0].value",
        controlType: "SWITCH",
        subtitle:
          "Turning on this property fixes the JSON substitution of bindings in API body by adding/removing quotes intelligently and reduces developer errors",
        initialValue: true,
      },
      {
        label: "API timeout (in milliseconds)",
        subtitle: "Maximum time after which the API will return",
        controlType: "INPUT_TEXT",
        configProperty: "actionConfiguration.timeoutInMillisecond",
        dataType: "NUMBER",
      },
    ],
  },
];
