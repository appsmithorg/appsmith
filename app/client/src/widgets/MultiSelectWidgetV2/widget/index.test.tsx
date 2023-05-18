import _ from "lodash";
import type { MultiSelectWidgetProps } from ".";
import { defaultOptionValueValidation } from ".";

const props = {
  serverSideFiltering: false,
  options: [
    { label: "Blue", value: "BLUE" },
    { label: "Green", value: "GREEN" },
    { label: "Red", value: "RED" },
    { label: "2022", value: 2022 },
    { label: "true", value: "true" },
    { label: "null", value: "null" },
    { label: "undefined", value: "undefined" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
  ],
};

const DEFAULT_ERROR_MESSAGE = {
  name: "TypeError",
  message:
    "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
};
const MISSING_FROM_OPTIONS = {
  name: "ValidationError",
  message:
    "Some or all default values are missing from options. Please update the values.",
};
const MISSING_FROM_OPTIONS_AND_WRONG_FORMAT = {
  name: "ValidationError",
  message:
    "Default value is missing in options. Please use [{label : <string | num>, value : < string | num>}] format to show default for server side data",
};

describe("defaultOptionValueValidation - ", () => {
  it("should get tested with empty string", () => {
    const input = "";

    expect(
      defaultOptionValueValidation(
        input,
        { ...props } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: [],
      messages: [{ name: "", message: "" }],
    });
  });

  it("should get tested with array of strings", () => {
    const input = ["green", "red"];

    expect(
      defaultOptionValueValidation(
        input,
        { ...props } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: false,
      parsed: input,
      messages: [MISSING_FROM_OPTIONS],
    });
  });

  it("should get tested with array of strings and stringified options", () => {
    const input = ["green", "red"];

    expect(
      defaultOptionValueValidation(
        input,
        {
          ...props,
          options: JSON.stringify(props.options) as unknown,
        } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: false,
      parsed: input,
      messages: [MISSING_FROM_OPTIONS],
    });
  });

  it("should get tested with a number", () => {
    const input = 2022;

    expect(
      defaultOptionValueValidation(
        input,
        { ...props } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: [input],
      messages: [{ name: "", message: "" }],
    });
  });
  it("should get tested with a string", () => {
    const inputs = [2022, "true", "null", "undefined"];

    inputs.forEach((input) => {
      expect(
        defaultOptionValueValidation(
          input,
          { ...props } as MultiSelectWidgetProps,
          _,
        ),
      ).toEqual({
        isValid: true,
        parsed: [input],
        messages: [{ name: "", message: "" }],
      });
    });
  });

  it("should get tested with array json string", () => {
    const input = `["GREEN", "RED"]`;

    expect(
      defaultOptionValueValidation(
        input,
        { ...props } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: ["GREEN", "RED"],
      messages: [{ name: "", message: "" }],
    });
  });

  it("should get tested with array of object json string", () => {
    const input = `[
      {
        "label": "green",
        "value": "GREEN"
      },
      {
        "label": "red",
        "value": "RED"
      }
    ]`;

    expect(
      defaultOptionValueValidation(
        input,
        { ...props } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: [
        {
          label: "green",
          value: "GREEN",
        },
        {
          label: "red",
          value: "RED",
        },
      ],
      messages: [{ name: "", message: "" }],
    });
  });

  it("should get tested with comma separated strings", () => {
    const input = "GREEN, RED";
    const input2 = "1, 2";

    expect(
      defaultOptionValueValidation(
        input,
        { ...props } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: ["GREEN", "RED"],
      messages: [{ name: "", message: "" }],
    });
    expect(
      defaultOptionValueValidation(
        input2,
        { ...props } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: ["1", "2"],
      messages: [{ name: "", message: "" }],
    });
  });

  it("should get tested with string and ServerSide filtering on", () => {
    const input = "YELLOW";

    expect(
      defaultOptionValueValidation(
        input,
        { ...props, serverSideFiltering: true } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: false,
      parsed: ["YELLOW"],
      messages: [MISSING_FROM_OPTIONS_AND_WRONG_FORMAT],
    });
  });

  it("should get tested with simple string", () => {
    const input = `{"green"`;

    expect(
      defaultOptionValueValidation(
        input,
        { ...props } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: false,
      parsed: [`{"green"`],
      messages: [MISSING_FROM_OPTIONS],
    });
  });

  it("should get tested with array of label, value and serverside filtering off", () => {
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
      defaultOptionValueValidation(
        input,
        { ...props } as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: false,
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
      messages: [MISSING_FROM_OPTIONS],
    });
  });

  it("should get tested with array of invalid values", () => {
    const testValues = [
      [
        undefined,
        {
          isValid: false,
          parsed: [],
          messages: [DEFAULT_ERROR_MESSAGE],
        },
      ],
      [
        null,
        {
          isValid: false,
          parsed: [],
          messages: [DEFAULT_ERROR_MESSAGE],
        },
      ],
      [
        true,
        {
          isValid: false,
          parsed: [],
          messages: [DEFAULT_ERROR_MESSAGE],
        },
      ],
      [
        {},
        {
          isValid: false,
          parsed: [],
          messages: [DEFAULT_ERROR_MESSAGE],
        },
      ],
      [
        [undefined],
        {
          isValid: false,
          parsed: [],
          messages: [DEFAULT_ERROR_MESSAGE],
        },
      ],
      [
        [true],
        {
          isValid: false,
          parsed: [],
          messages: [DEFAULT_ERROR_MESSAGE],
        },
      ],
      [
        ["green", "green"],
        {
          isValid: false,
          parsed: [],
          messages: [
            {
              name: "ValidationError",
              message: "values must be unique. Duplicate values found",
            },
          ],
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
          messages: [
            {
              name: "ValidationError",
              message: "path:value must be unique. Duplicate values found",
            },
          ],
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
          messages: [DEFAULT_ERROR_MESSAGE],
        },
      ],
    ];

    testValues.forEach(([input, expected]) => {
      expect(
        defaultOptionValueValidation(
          input,
          { ...props } as MultiSelectWidgetProps,
          _,
        ),
      ).toEqual(expected);
    });
  });
});
