import _ from "lodash";
import {
  defaultOptionValueValidation,
  getSelectedOptions,
  MultiSelectWidgetProps,
} from ".";

describe("defaultOptionValueValidation - ", () => {
  it("should get tested with empty string", () => {
    const input = "";

    expect(
      defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: [],
      messages: [""],
    });
  });

  it("should get tested with array of strings", () => {
    const input = ["green", "red"];

    expect(
      defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: input,
      messages: [""],
    });
  });

  it("should get tested with a number", () => {
    const input = 2022;

    expect(
      defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: [input],
      messages: [""],
    });
  });
  it("should get tested with a string", () => {
    const inputs = ["2022", "true", "null", "test", "undefined"];

    inputs.forEach((input) => {
      expect(
        defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
      ).toEqual({
        isValid: true,
        parsed: [input],
        messages: [""],
      });
    });
  });

  it("should get tested with array json string", () => {
    const input = `["green", "red"]`;

    expect(
      defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: ["green", "red"],
      messages: [""],
    });
  });

  it("should get tested with array of object json string", () => {
    const input = `[
      {
        "label": "green",
        "value": "green"
      },
      {
        "label": "red",
        "value": "red"
      }
    ]`;

    expect(
      defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: [
        {
          label: "green",
          value: "green",
        },
        {
          label: "red",
          value: "red",
        },
      ],
      messages: [""],
    });
  });

  it("should get tested with comma separated strings", () => {
    const input = "green, red";
    const input2 = "1, 2";

    expect(
      defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: ["green", "red"],
      messages: [""],
    });
    expect(
      defaultOptionValueValidation(input2, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: ["1", "2"],
      messages: [""],
    });
  });

  it("should get tested with simple string", () => {
    const input = "green";

    expect(
      defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: ["green"],
      messages: [""],
    });
  });

  it("should get tested with simple string", () => {
    const input = `{"green"`;

    expect(
      defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: [`{"green"`],
      messages: [""],
    });
  });

  it("should get tested with array of label, value", () => {
    const input = [
      {
        label: "green",
        value: "green",
      },
      {
        label: "red",
        value: "red",
      },
    ];

    expect(
      defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: [
        {
          label: "green",
          value: "green",
        },
        {
          label: "red",
          value: "red",
        },
      ],
      messages: [""],
    });
  });

  it("should get tested with array of invalid values", () => {
    const testValues = [
      [
        undefined,
        {
          isValid: false,
          parsed: [],
          messages: [
            "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
          ],
        },
      ],
      [
        null,
        {
          isValid: false,
          parsed: [],
          messages: [
            "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
          ],
        },
      ],
      [
        true,
        {
          isValid: false,
          parsed: [],
          messages: [
            "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
          ],
        },
      ],
      [
        {},
        {
          isValid: false,
          parsed: [],
          messages: [
            "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
          ],
        },
      ],
      [
        [undefined],
        {
          isValid: false,
          parsed: [],
          messages: [
            "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
          ],
        },
      ],
      [
        [true],
        {
          isValid: false,
          parsed: [],
          messages: [
            "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
          ],
        },
      ],
      [
        ["green", "green"],
        {
          isValid: false,
          parsed: [],
          messages: ["values must be unique. Duplicate values found"],
        },
      ],
      [
        [
          {
            label: "green",
            value: "green",
          },
          {
            label: "green",
            value: "green",
          },
        ],
        {
          isValid: false,
          parsed: [],
          messages: ["path:value must be unique. Duplicate values found"],
        },
      ],
      [
        [
          {
            label: "green",
          },
          {
            label: "green",
          },
        ],
        {
          isValid: false,
          parsed: [],
          messages: [
            "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
          ],
        },
      ],
    ];

    testValues.forEach(([input, expected]) => {
      expect(
        defaultOptionValueValidation(input, {} as MultiSelectWidgetProps, _),
      ).toEqual(expected);
    });
  });
});

describe("getSelectedOptions", () => {
  const options = [
    {
      label: "Blue",
      value: "BLUE",
    },
    {
      label: "Green",
      value: "GREEN",
    },
    {
      label: "Red",
      value: "RED",
    },
  ];
  it("serverSideFiltering, returns selectedOptions", () => {
    expect(getSelectedOptions(true, ["YELLOW"], options)).toEqual([
      { label: "YELLOW", value: "YELLOW" },
    ]);
  });

  it("serverSideFiltering = false, returns only values which are in options", () => {
    expect(getSelectedOptions(false, ["YELLOW", options])).toEqual([]);
  });
});
