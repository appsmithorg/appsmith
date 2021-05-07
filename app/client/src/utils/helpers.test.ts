import { flattenObject } from "./helpers";

describe("flattenObject test", () => {
  it("Check if non nested object is returned correctly", () => {
    const testObject = {
      isVisible: true,
      isDisabled: false,
      tableData: false,
    };

    expect(flattenObject(testObject)).toStrictEqual(testObject);
  });

  it("Check if nested objects are returned correctly", () => {
    const tests = [
      {
        input: {
          isVisible: true,
          isDisabled: false,
          tableData: false,
          settings: {
            color: [
              {
                headers: {
                  left: true,
                },
              },
            ],
          },
        },
        output: {
          isVisible: true,
          isDisabled: false,
          tableData: false,
          "settings.color[0].headers.left": true,
        },
      },
      {
        input: {
          isVisible: true,
          isDisabled: false,
          tableData: false,
          settings: {
            color: true,
          },
        },
        output: {
          isVisible: true,
          isDisabled: false,
          tableData: false,
          "settings.color": true,
        },
      },
      {
        input: {
          numbers: [1, 2, 3],
          color: { header: "red" },
        },
        output: {
          "numbers[0]": 1,
          "numbers[1]": 2,
          "numbers[2]": 3,
          "color.header": "red",
        },
      },
      {
        input: {
          name: null,
          color: { header: {} },
          users: {
            id: undefined,
          },
        },
        output: {
          "color.header": {},
          name: null,
          "users.id": undefined,
        },
      },
    ];

    tests.map((test) =>
      expect(flattenObject(test.input)).toStrictEqual(test.output),
    );
  });
});
