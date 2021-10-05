import {
  isHidden,
  getConfigInitialValues,
  caculateIsHidden,
  evaluateCondtionWithType,
  actionPathFromName,
} from "./utils";
import { HiddenType } from "./BaseControl";

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
