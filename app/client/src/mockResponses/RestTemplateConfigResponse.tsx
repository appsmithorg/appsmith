const RestTemplateConfigResponse = [
  {
    sectionName: "General",
    children: [
      {
        label: "URL",
        configProperty: "datasourceConfiguration.url",
        controlType: "INPUT_TEXT",
        isRequired: true,
        placeholderText: "https://example.com",
      },
      {
        label: "Headers",
        configProperty: "datasourceConfiguration.headers",
        controlType: "KEY_VAL_INPUT",
      },
      // {
      //   label: "Environment Variables",
      //   configProperty: "datasourceConfiguration.envVars",
      //   controlType: "KEY_VAL_INPUT",
      // },
    ],
  },
];

export default RestTemplateConfigResponse;
