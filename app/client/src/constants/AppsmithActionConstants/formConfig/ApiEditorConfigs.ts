export default [
  {
    sectionName: "",
    id: 1,
    children: [
      {
        label: "Path",
        configProperty: "actionConfiguration.path",
        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
      },
      {
        label: "Body",
        configProperty: "actionConfiguration.body",
        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
        evaluationSubstitutionType: "SMART_SUBSTITUTE",
        hidden: {
          path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
          comparison: "EQUALS",
          value: false,
        },
      },
      {
        label: "Body",
        configProperty: "actionConfiguration.body",
        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
        evaluationSubstitutionType: "TEMPLATE",
        hidden: {
          path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
          comparison: "EQUALS",
          value: true,
        },
      },
      {
        label: "Query Parameters",
        configProperty: "actionConfiguration.queryParameters",
        controlType: "ARRAY_FIELD",
        schema: [
          {
            label: "Key",
            key: "key",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            placeholderText: "Key",
          },
          {
            label: "Value",
            key: "value",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            placeholderText: "Value",
          },
        ],
      },
      {
        label: "Headers",
        configProperty: "actionConfiguration.headers",
        controlType: "ARRAY_FIELD",
        schema: [
          {
            label: "Key",
            key: "key",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            placeholderText: "Key",
          },
          {
            label: "Value",
            key: "value",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            placeholderText: "Value",
          },
        ],
      },
      {
        label: "Form data",
        configProperty: "actionConfiguration.bodyFormData",
        controlType: "ARRAY_FIELD",
        schema: [
          {
            label: "Key",
            key: "key",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            placeholderText: "Key",
          },
          {
            label: "Value",
            key: "value",
            controlType: "QUERY_DYNAMIC_INPUT_TEXT",
            placeholderText: "Value",
          },
        ],
      },
    ],
  },
];
