import {
  isHidden,
  getConfigInitialValues,
  caculateIsHidden,
  evaluateCondtionWithType,
  actionPathFromName,
  getViewType,
  ViewTypes,
  switchViewType,
  extractConditionalOutput,
  checkIfSectionCanRender,
  checkIfSectionIsEnabled,
  updateEvaluatedSectionConfig,
} from "./utils";
import { HiddenType } from "./BaseControl";
import { set } from "lodash";
import { isValidFormConfig } from "reducers/evaluationReducers/formEvaluationReducer";

describe("isHidden test", () => {
  it("Test for isHidden true", () => {
    const hiddenTrueInputs: any = [
      { values: { name: "Name" }, hidden: true },
      {
        values: { name: "Name", number: 2, email: "temp@temp.com" },
        hidden: {
          conditionType: "AND",
          conditions: [
            {
              path: "name",
              value: "Name",
              comparison: "EQUALS",
            },
            {
              conditionType: "AND",
              conditions: [
                {
                  path: "number",
                  value: 2,
                  comparison: "EQUALS",
                },
                {
                  path: "email",
                  value: "temp@temp.com",
                  comparison: "EQUALS",
                },
              ],
            },
          ],
        },
      },
      {
        values: { name: "Name" },
        hidden: {
          path: "name",
          value: "Name",
          comparison: "EQUALS",
        },
      },
      {
        values: { name: "Name", config: { type: "EMAIL" } },
        hidden: {
          path: "name.config.type",
          value: "USER_ID",
          comparison: "NOT_EQUALS",
        },
      },
      {
        values: undefined,
        hidden: true,
      },
      {
        values: null,
        hidden: true,
      },
    ];

    hiddenTrueInputs.forEach((input: any) => {
      expect(isHidden(input.values, input.hidden)).toBeTruthy();
    });
  });

  it("Test for isHidden false", () => {
    const hiddenFalseInputs: any = [
      { values: { name: "Name" }, hidden: false },
      {
        values: { name: "Name" },
        hidden: {
          path: "name",
          value: "Different Name",
          comparison: "EQUALS",
        },
      },
      {
        values: { name: "Name", config: { type: "EMAIL" } },
        hidden: {
          path: "config.type",
          value: "EMAIL",
          comparison: "NOT_EQUALS",
        },
      },
      {
        values: { name: "Name", config: { type: "Different BODY" } },
        hidden: {
          path: "config.type",
          value: ["EMAIL", "BODY"],
          comparison: "IN",
        },
      },
      {
        values: { name: "Name", config: { type: "BODY" } },
        hidden: {
          path: "config.type",
          value: ["EMAIL", "BODY"],
          comparison: "NOT_IN",
        },
      },
      {
        values: undefined,
        hidden: false,
      },
      {
        values: null,
        hidden: false,
      },
      {
        values: undefined,
      },
      {
        values: { name: "Name" },
      },
      {
        values: {
          name: "Name",
          config: { type: "EMAIL", name: "TEMP" },
          contact: { number: 1234, address: "abcd" },
        },
        hidden: {
          conditionType: "AND",
          conditions: [
            {
              path: "contact.number",
              value: 1234,
              comparison: "NOT_EQUALS",
            },
            {
              conditionType: "OR",
              conditions: [
                {
                  conditionType: "AND",
                  conditions: [
                    {
                      path: "config.name",
                      value: "TEMP",
                      comparison: "EQUALS",
                    },
                    {
                      path: "config.name",
                      value: "HELLO",
                      comparison: "EQUALS",
                    },
                  ],
                },
                {
                  path: "config.type",
                  value: "EMAIL",
                  comparison: "NOT_EQUALS",
                },
              ],
            },
          ],
        },
      },
    ];

    hiddenFalseInputs.forEach((input: any) => {
      expect(isHidden(input.values, input.hidden)).toBeFalsy();
    });
  });
});

describe("getConfigInitialValues test", () => {
  it("getConfigInitialValues test", () => {
    const testCases = [
      {
        input: [
          {
            sectionName: "Connection",
            children: [
              {
                label: "Region",
                configProperty:
                  "datasourceConfiguration.authentication.databaseName",
                controlType: "DROP_DOWN",
                initialValue: "ap-south-1",
                options: [
                  {
                    label: "ap-south-1",
                    value: "ap-south-1",
                  },
                  {
                    label: "eu-south-1",
                    value: "eu-south-1",
                  },
                ],
              },
            ],
          },
        ],
        output: {
          datasourceConfiguration: {
            authentication: { databaseName: "ap-south-1" },
          },
        },
      },
      {
        input: [
          {
            sectionName: "Connection",
            children: [
              {
                label: "Region",
                configProperty:
                  "datasourceConfiguration.authentication.databaseName",
                controlType: "INPUT_TEXT",
              },
            ],
          },
        ],
        output: {},
      },
      {
        input: [
          {
            sectionName: "Connection",
            children: [
              {
                label: "Host Address (for overriding endpoint only)",
                configProperty: "datasourceConfiguration.endpoints[*].host",
                controlType: "KEYVALUE_ARRAY",
                initialValue: ["jsonplaceholder.typicode.com"],
              },
              {
                label: "Port",
                configProperty: "datasourceConfiguration.endpoints[*].port",
                dataType: "NUMBER",
                controlType: "KEYVALUE_ARRAY",
              },
            ],
          },
        ],
        output: {
          datasourceConfiguration: {
            endpoints: [{ host: "jsonplaceholder.typicode.com" }],
          },
        },
      },
      {
        input: [
          {
            sectionName: "Settings",
            children: [
              {
                label: "Smart substitution",
                configProperty: "datasourceConfiguration.isSmart",
                controlType: "SWITCH",
                initialValue: false,
              },
            ],
          },
        ],
        output: {
          datasourceConfiguration: {
            isSmart: false,
          },
        },
      },
    ];

    testCases.forEach((testCase) => {
      expect(getConfigInitialValues(testCase.input)).toEqual(testCase.output);
    });
  });
});

describe("caculateIsHidden test", () => {
  it("calcualte hidden field value", () => {
    const values = { name: "Name" };
    const hiddenTruthy: HiddenType = {
      path: "name",
      comparison: "EQUALS",
      value: "Name",
    };
    const hiddenFalsy: HiddenType = {
      path: "name",
      comparison: "EQUALS",
      value: "Different Name",
    };
    expect(caculateIsHidden(values, hiddenTruthy)).toBeTruthy();
    expect(caculateIsHidden(values, hiddenFalsy)).toBeFalsy();
  });
});

describe("evaluateCondtionWithType test", () => {
  it("accumulate boolean of array into one based on conditionType", () => {
    const andConditionType = "AND";
    const orConditionType = "OR";
    const booleanArray = [true, false, true];

    expect(
      evaluateCondtionWithType(booleanArray, andConditionType),
    ).toBeFalsy();
    expect(
      evaluateCondtionWithType(booleanArray, orConditionType),
    ).toBeTruthy();
  });
});

describe("actionPathFromName test", () => {
  it("creates path from name", () => {
    const actionName = "Api5";
    const name = "actionConfiguration.pluginSpecifiedTemplates[7].value";
    const pathName = "Api5.config.pluginSpecifiedTemplates[7].value";

    expect(actionPathFromName(actionName, name)).toEqual(pathName);
  });
});

describe("json/form viewTypes test", () => {
  it("should return correct viewType", () => {
    const testValues = {
      actionConfiguration: {
        formData: {
          node1: { data: "value1" },
          node3: { data: "value1" },
          node2: { data: "value1", viewType: ViewTypes.JSON },
          node4: { data: "value1", viewType: ViewTypes.COMPONENT },
          node5: { bata: "value1", viewType: ViewTypes.COMPONENT },
        },
      },
      actionConfiguration2: {
        formData: {
          node6: { data: "value1", viewType: ViewTypes.COMPONENT },
        },
      },
    };
    const testCases = [
      {
        input: "actionConfiguration.formData.node1.data",
        output: ViewTypes.COMPONENT,
      },
      {
        input: "actionConfiguration.formData.node2.data",
        output: ViewTypes.JSON,
      },
      {
        input: "actionConfiguration.formData.node3.data",
        output: ViewTypes.COMPONENT,
      },
      {
        input: "actionConfiguration.formData.node4.data",
        output: ViewTypes.COMPONENT,
      },
      {
        input: "actionConfiguration.formData.node5.bata",
        output: ViewTypes.COMPONENT,
      },
      {
        input: "actionConfiguration2.formData.node6.bata",
        output: ViewTypes.COMPONENT,
      },
    ];
    testCases.forEach((testCase) => {
      expect(getViewType(testValues, testCase.input)).toEqual(testCase.output);
    });
  });

  it("should change the viewType", () => {
    const outputValues: any[] = [
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: { data: "value1" },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node4: { data: "value1", viewType: ViewTypes.COMPONENT },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: { data: "value1" },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node4: { data: "value1", viewType: ViewTypes.COMPONENT },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: { data: "value1" },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node4: {
              data: "value1",
              viewType: ViewTypes.COMPONENT,
              jsonData: "value2",
            },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: { data: "value1" },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node4: { data: "value1", viewType: ViewTypes.COMPONENT },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: { data: "value1" },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node4: { data: "value1", viewType: ViewTypes.COMPONENT },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: { data: "value1" },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node4: { data: "value1", viewType: ViewTypes.COMPONENT },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
    ];
    const customSetterFunction = (
      formName: string,
      path: string,
      value: any,
    ) => {
      set(outputValues[Number(formName.split("-")[1])], path, value);
    };
    const inputValue = {
      actionConfiguration: {
        formData: {
          node1: { data: "value1" },
          node2: { data: "value1", viewType: ViewTypes.JSON },
          node3: { data: "value1" },
          node4: {
            data: "value1",
            viewType: ViewTypes.COMPONENT,
            jsonData: "value2",
          },
          node5: {
            data: "value1",
            viewType: ViewTypes.JSON,
            componentData: "value2",
          },
          node6: {
            viewType: ViewTypes.COMPONENT,
          },
        },
      },
    };
    const expectedOutputValues: any[] = [
      {
        actionConfiguration: {
          formData: {
            node1: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value1",
            },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node3: { data: "value1" },
            node4: { data: "value1", viewType: ViewTypes.COMPONENT },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: { data: "value1" },
            node2: {
              data: "value1",
              viewType: ViewTypes.COMPONENT,
              jsonData: "value1",
            },
            node4: { data: "value1", viewType: ViewTypes.COMPONENT },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: { data: "value1" },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node4: {
              data: "value2",
              viewType: ViewTypes.JSON,
              jsonData: "value2",
              componentData: "value1",
            },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: { data: "value1" },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node4: { data: "value1", viewType: ViewTypes.COMPONENT },
            node5: {
              data: "value2",
              viewType: ViewTypes.COMPONENT,
              componentData: "value2",
              jsonData: "value1",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node3: {
              data: "value1",
              jsonData: "value1",
              viewType: ViewTypes.COMPONENT,
            },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node4: { data: "value1", viewType: ViewTypes.COMPONENT },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.COMPONENT,
            },
          },
        },
      },
      {
        actionConfiguration: {
          formData: {
            node1: { data: "value1" },
            node2: { data: "value1", viewType: ViewTypes.JSON },
            node3: { data: "value1" },
            node4: {
              data: "value1",
              viewType: ViewTypes.COMPONENT,
            },
            node5: {
              data: "value1",
              viewType: ViewTypes.JSON,
              componentData: "value2",
            },
            node6: {
              viewType: ViewTypes.JSON,
              data: "",
              componentData: "",
            },
          },
        },
      },
    ];
    const testCases = [
      {
        path: "actionConfiguration.formData.node1.data",
        viewType: ViewTypes.COMPONENT,
      },
      {
        path: "actionConfiguration.formData.node2.data",
        viewType: ViewTypes.JSON,
      },
      {
        path: "actionConfiguration.formData.node4.data",
        viewType: ViewTypes.COMPONENT,
      },
      {
        path: "actionConfiguration.formData.node5.data",
        viewType: ViewTypes.JSON,
      },
      {
        path: "actionConfiguration.formData.node3.data",
        viewType: ViewTypes.JSON,
      },
      {
        path: "actionConfiguration.formData.node6.data",
        viewType: ViewTypes.COMPONENT,
      },
    ];
    testCases.forEach((testCase, index) => {
      const formName = `testForm-${index}`;
      switchViewType(
        inputValue,
        testCase.path,
        testCase.viewType,
        formName,
        customSetterFunction,
      );
      expect(outputValues[index]).toEqual(expectedOutputValues[index]);
    });
  });
});

describe("UQI form render methods", () => {
  it("extract conditional output", () => {
    const expectedOutputs = [
      {},
      {
        conditionals: {},
        visible: true,
        enabled: true,
      },
      {
        conditionals: {},
        visible: true,
        enabled: false,
      },
      {
        conditionals: {},
        visible: false,
        enabled: true,
      },
    ];
    const testCases = [
      {
        name: "section1",
      },
      {
        name: "section2",
        identifier: "identifier",
      },
      {
        name: "section3",
        configProperty: "configProperty",
        identifier: "identifier",
      },
      {
        name: "section4",
        configProperty: "configProperty",
        propertyName: "propertyName",
        identifier: "identifier",
      },
    ];
    testCases.forEach((testCase, index) => {
      const output = extractConditionalOutput(testCase, formEvaluation);
      expect(output).toEqual(expectedOutputs[index]);
    });
  });

  it("section render test", () => {
    const testCases = [
      {
        input: "identifier",
        output: true,
      },
      {
        input: "configProperty",
        output: true,
      },
      {
        input: "propertyName",
        output: false,
      },
      {
        input: "identifier2",
        output: true,
      },
      {
        input: "identifier3",
        output: false,
      },
      {
        input: "identifier4",
        output: false,
      },
      {
        input: "identifier5",
        output: true,
      },
    ];
    testCases.forEach((testCase) => {
      const output = checkIfSectionCanRender(formEvaluation[testCase.input]);
      expect(output).toEqual(testCase.output);
    });
  });

  it("section enabled/disabled test", () => {
    const testCases = [
      {
        input: "identifier",
        output: true,
      },
      {
        input: "configProperty",
        output: false,
      },
      {
        input: "propertyName",
        output: true,
      },
      {
        input: "identifier2",
        output: false,
      },
      {
        input: "identifier3",
        output: true,
      },
    ];
    testCases.forEach((testCase) => {
      const output = checkIfSectionIsEnabled(formEvaluation[testCase.input]);
      expect(output).toEqual(testCase.output);
    });
  });

  it("check if valid form config", () => {
    const testCases: any[] = [
      {
        input: {},
        output: false,
      },
      {
        input: {
          controlType: "SECTION",
          label: "Select Bucket to Query",
          children: [
            {
              label: "Bucket Name",
              configProperty: "actionConfiguration.formData.bucket.data",
              controlType: "QUERY_DYNAMIC_INPUT_TEXT",
              evaluationSubstitutionType: "TEMPLATE",
              isRequired: true,
              initialValue: "",
            },
          ],
        },
        output: true,
      },
      {
        input: {
          label: "Select Bucket to Query",
          children: [
            {
              label: "Bucket Name",
              configProperty: "actionConfiguration.formData.bucket.data",
              controlType: "QUERY_DYNAMIC_INPUT_TEXT",
              evaluationSubstitutionType: "TEMPLATE",
              isRequired: true,
              initialValue: "",
            },
          ],
        },
        output: false,
      },
    ];

    testCases.forEach((testCase) => {
      const output = isValidFormConfig(testCase.input);
      expect(output).toEqual(testCase.output);
    });
  });

  it("update section config tests", () => {
    const testCases = [
      {
        input: {
          sectionObject: {
            key1: "valueX",
            key2: "valueY",
            disabled: false,
            visible: false,
            controlType: "SECTION",
          },
          path: "updateSectionConfigTest1",
        },
        output: {
          key1: "value1",
          key2: "value2",
          disabled: false,
          visible: false,
          controlType: "SECTION",
        },
      },
      {
        input: {
          sectionObject: {
            key1: "valueX",
            key2: "valueY",
            disabled: false,
            visible: false,
            controlType: "SECTION",
          },
          path: "updateSectionConfigTest2",
        },
        output: {
          key1: "valueX",
          key2: "valueY",
          disabled: false,
          visible: false,
          controlType: "SECTION",
        },
      },
    ];

    testCases.forEach((testCase) => {
      const output = updateEvaluatedSectionConfig(
        testCase.input.sectionObject,
        formEvaluation[testCase.input.path],
      );
      expect(output).toEqual(testCase.output);
    });
  });
});

// Constant evaluation object used for testing
const formEvaluation: Record<string, any> = {
  propertyName: {
    conditionals: {},
    visible: false,
    enabled: true,
  },
  configProperty: {
    conditionals: {},
    visible: true,
    enabled: false,
  },
  identifier: {
    conditionals: {},
    visible: true,
    enabled: true,
  },
  identifier2: {
    conditionals: {},
    enabled: false,
  },
  identifier3: {
    conditionals: {},
    visible: false,
  },
  identifier4: {
    conditionals: {},
    visible: true,
    evaluateFormConfig: {
      updateEvaluatedConfig: false,
    },
  },
  identifier5: {
    conditionals: {},
    visible: true,
    evaluateFormConfig: {
      updateEvaluatedConfig: "false",
    },
  },
  updateSectionConfigTest1: {
    conditionals: {},
    visible: true,
    enabled: true,
    evaluateFormConfig: {
      updateEvaluatedConfig: true,
      evaluateFormConfigObject: {
        key1: { output: "value1" },
        key2: { output: "value2" },
      },
    },
  },
  updateSectionConfigTest2: {
    conditionals: {},
    visible: true,
    enabled: true,
    evaluateFormConfig: {
      updateEvaluatedConfig: false,
      evaluateFormConfigObject: {
        key1: { output: "value1" },
        key2: { output: "value2" },
      },
    },
  },
};
