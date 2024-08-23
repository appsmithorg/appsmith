import { ViewTypes, type HiddenType } from "@appsmith/types";
import {
  calculateIsHidden,
  evaluateCondtionWithType,
  getFormControlViewType,
  isFormControlHidden,
} from "./utils";

describe("calculateIsHidden test", () => {
  it("calcualte hidden field value", () => {
    const values = {
      datasourceStorages: {
        unused_env: { name: "Name" },
      },
    };
    const hiddenTruthy: HiddenType = {
      path: "datasourceStorages.unused_env.name",
      comparison: "EQUALS",
      value: "Name",
      flagValue: "TEST_FLAG",
    };
    const hiddenFalsy: HiddenType = {
      path: "datasourceStorages.unused_env.name",
      comparison: "EQUALS",
      value: "Different Name",
      flagValue: "TEST_FLAG",
    };
    expect(calculateIsHidden(values, hiddenTruthy)).toBeTruthy();
    expect(calculateIsHidden(values, hiddenFalsy)).toBeFalsy();
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
      expect(getFormControlViewType(testValues, testCase.input)).toEqual(
        testCase.output,
      );
    });
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

describe("isFormControlHidden test", () => {
  it("Test for isFormControlHidden true", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hiddenTrueInputs: any = [
      { values: { name: "Name" }, hidden: true },
      {
        values: {
          datasourceStorages: {
            unused_env: { name: "Name", number: 2, email: "temp@temp.com" },
          },
        },
        hidden: {
          conditionType: "AND",
          conditions: [
            {
              path: "datasourceStorages.unused_env.name",
              value: "Name",
              comparison: "EQUALS",
            },
            {
              conditionType: "AND",
              conditions: [
                {
                  path: "datasourceStorages.unused_env.number",
                  value: 2,
                  comparison: "EQUALS",
                },
                {
                  path: "datasourceStorages.unused_env.email",
                  value: "temp@temp.com",
                  comparison: "EQUALS",
                },
              ],
            },
          ],
        },
      },
      {
        values: {
          datasourceStorages: {
            unused_env: { name: "Name" },
          },
        },
        hidden: {
          path: "datasourceStorages.unused_env.name",
          value: "Name",
          comparison: "EQUALS",
        },
      },
      {
        values: {
          datasourceStorages: {
            unused_env: { name: "Name", config: { type: "EMAIL" } },
          },
        },
        hidden: {
          path: "datasourceStorages.unused_env.name.config.type",
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

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hiddenTrueInputs.forEach((input: any) => {
      expect(isFormControlHidden(input.values, input.hidden)).toBeTruthy();
    });
  });

  it("Test for isFormControlHidden false", () => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hiddenFalseInputs: any = [
      { values: { name: "Name" }, hidden: false },
      {
        values: {
          datasourceStorages: {
            unused_env: { name: "Name" },
          },
        },
        hidden: {
          path: "datasourceStorages.unused_env.name",
          value: "Different Name",
          comparison: "EQUALS",
        },
      },
      {
        values: {
          datasourceStorages: {
            unused_env: { name: "Name", config: { type: "EMAIL" } },
          },
        },
        hidden: {
          path: "datasourceStorages.unused_env.config.type",
          value: "EMAIL",
          comparison: "NOT_EQUALS",
        },
      },
      {
        values: {
          datasourceStorages: {
            unused_env: { name: "Name", config: { type: "Different BODY" } },
          },
        },
        hidden: {
          path: "datasourceStorages.unused_env.config.type",
          value: ["EMAIL", "BODY"],
          comparison: "IN",
        },
      },
      {
        values: {
          datasourceStorages: {
            unused_env: { name: "Name", config: { type: "BODY" } },
          },
        },
        hidden: {
          path: "datasourceStorages.unused_env.config.type",
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
        values: {
          datasourceStorages: {
            unused_env: { name: "Name" },
          },
        },
      },
      {
        values: {
          datasourceStorages: {
            unused_env: {
              name: "Name",
              config: { type: "EMAIL", name: "TEMP" },
              contact: { number: 1234, address: "abcd" },
            },
          },
        },
        hidden: {
          conditionType: "AND",
          conditions: [
            {
              path: "datasourceStorages.unused_env.contact.number",
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
                      path: "datasourceStorages.unused_env.config.name",
                      value: "TEMP",
                      comparison: "EQUALS",
                    },
                    {
                      path: "datasourceStorages.unused_env.config.name",
                      value: "HELLO",
                      comparison: "EQUALS",
                    },
                  ],
                },
                {
                  path: "datasourceStorages.unused_env.config.type",
                  value: "EMAIL",
                  comparison: "NOT_EQUALS",
                },
              ],
            },
          ],
        },
      },
    ];

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    hiddenFalseInputs.forEach((input: any) => {
      expect(isFormControlHidden(input.values, input.hidden)).toBeFalsy();
    });
  });
});
