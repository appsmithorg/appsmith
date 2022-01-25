import {
  flattenObject,
  getLocale,
  getSubstringBetweenTwoWords,
  mergeWidgetConfig,
} from "./helpers";

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

describe("#getSubstringBetweenTwoWords", () => {
  it("returns substring between 2 words from a string", () => {
    const input: [string, string, string][] = [
      ["aaa.bbb.ccc", "aaa.", ".ccc"],
      ["aaa.bbb.bbb.ccc", "aaa.", ".ccc"],
      ["aaa.aaa.aaa.aaa", "aaa", "aaa"],
      ["aaa...aaa.aaa.aaa", "aaa", "aaa"],
      ["aaa..bbb", "aaa.", ".bbb"],
      ["aaa.bbb", "aaa.", ".bbb"],
      ["aaabbb", "aaab", "abbb"],
    ];

    const output = ["bbb", "bbb.bbb", ".aaa.aaa.", "...aaa.aaa.", "", "", ""];

    input.forEach((inp, index) => {
      expect(getSubstringBetweenTwoWords(...inp)).toBe(output[index]);
    });
  });
});

describe("#mergeWidgetConfig", () => {
  it("should merge the widget configs", () => {
    const base = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "someWidgetConfig",
          },
        ],
      },
      {
        sectionName: "icon",
        children: [
          {
            propertyName: "someWidgetIconConfig",
          },
        ],
      },
    ];
    const extended = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "someOtherWidgetConfig",
          },
        ],
      },
      {
        sectionName: "style",
        children: [
          {
            propertyName: "someWidgetStyleConfig",
          },
        ],
      },
    ];
    const expected = [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "someOtherWidgetConfig",
          },
          {
            propertyName: "someWidgetConfig",
          },
        ],
      },
      {
        sectionName: "style",
        children: [
          {
            propertyName: "someWidgetStyleConfig",
          },
        ],
      },
      {
        sectionName: "icon",
        children: [
          {
            propertyName: "someWidgetIconConfig",
          },
        ],
      },
    ];

    expect(mergeWidgetConfig(extended, base)).toEqual(expected);
  });
});

describe("#getLocale", () => {
  it("should test that getLocale is returning navigator.languages[0]", () => {
    expect(getLocale()).toBe(navigator.languages[0]);
  });
});
