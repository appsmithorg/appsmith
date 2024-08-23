import {
  actionPathFromName,
  checkIfSectionCanRender,
  checkIfSectionIsEnabled,
  extractConditionalOutput,
  getConfigInitialValues,
  switchViewType,
  updateEvaluatedSectionConfig,
} from "./utils";
import { set } from "lodash";
import { isValidFormConfig } from "reducers/evaluationReducers/formEvaluationReducer";
import { ViewTypes } from "@appsmith/types";

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
                  "datasourceStorages.unused_env.datasourceConfiguration.authentication.databaseName",
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
          datasourceStorages: {
            unused_env: {
              datasourceConfiguration: {
                authentication: { databaseName: "ap-south-1" },
              },
            },
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
                  "datasourceStorages.unused_env.datasourceConfiguration.authentication.databaseName",
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
                label: "Host address (for overriding endpoint only)",
                configProperty:
                  "datasourceStorages.unused_env.datasourceConfiguration.endpoints[*].host",
                controlType: "KEYVALUE_ARRAY",
                initialValue: ["jsonplaceholder.typicode.com"],
              },
              {
                label: "Port",
                configProperty:
                  "datasourceStorages.unused_env.datasourceConfiguration.endpoints[*].port",
                dataType: "NUMBER",
                controlType: "KEYVALUE_ARRAY",
              },
            ],
          },
        ],
        output: {
          datasourceStorages: {
            unused_env: {
              datasourceConfiguration: {
                endpoints: [{ host: "jsonplaceholder.typicode.com" }],
              },
            },
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
                configProperty:
                  "datasourceStorages.unused_env.datasourceConfiguration.isSmart",
                controlType: "SWITCH",
                initialValue: false,
              },
            ],
          },
        ],
        output: {
          datasourceStorages: {
            unused_env: {
              datasourceConfiguration: {
                isSmart: false,
              },
            },
          },
        },
      },
    ];

    testCases.forEach((testCase) => {
      expect(getConfigInitialValues(testCase.input)).toEqual(testCase.output);
    });
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
  it("should change the viewType", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              data: "value1",
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
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testCases: any[] = [
      {
        input: {},
        output: false,
      },
      {
        input: {
          controlType: "SECTION",
          label: "Select bucket to query",
          children: [
            {
              label: "Bucket name",
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
          label: "Select bucket to query",
          children: [
            {
              label: "Bucket name",
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
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
