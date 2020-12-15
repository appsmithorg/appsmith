import { isHidden, getConfigInitialValues } from "./utils";

describe("isHidden test", () => {
  it("Test for isHidden true", () => {
    const hiddenTrueInputs: any = [
      { values: { name: "Name" }, hidden: true },
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
    ];

    testCases.forEach(testCase => {
      expect(getConfigInitialValues(testCase.input)).toEqual(testCase.output);
    });
  });
});
