import type { LoDashStatic } from "lodash";
import { set } from "lodash";
import _ from "lodash";
import { EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import {
  labelKeyValidation,
  getLabelValueAdditionalAutocompleteData,
  getLabelValueKeyOptions,
  valueKeyValidation,
} from "./propertyUtils";
import type { MultiSelectWidgetProps } from ".";
import { defaultOptionValueValidation } from "./propertyUtils";

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

describe("labelKeyValidation", () => {
  test("should test that empty values return error", () => {
    ["", undefined, null].forEach((d) => {
      expect(
        labelKeyValidation(d, {} as MultiSelectWidgetProps, _),
      ).toEqual({
        parsed: "",
        isValid: false,
        messages: [
          {
            name: "ValidationError",
            message: `value does not evaluate to type: string | Array<string>`,
          },
        ],
      });
    });
  });

  test("should test that string values validates", () => {
    expect(
      labelKeyValidation(
        "test",
        {} as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      parsed: "test",
      isValid: true,
      messages: [],
    });
  });

  test("should test that array of string value validates", () => {
    expect(
      labelKeyValidation(
        ["blue", "green", "yellow"],
        {} as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      parsed: ["blue", "green", "yellow"],
      isValid: true,
      messages: [],
    });
  });

  test("should test that all other values return error", () => {
    //invalid array entry
    [
      ["blue", 1, "yellow"],
      ["blue", {}, "yellow"],
      ["blue", true, "yellow"],
      ["blue", [], "yellow"],
      ["blue", undefined, "yellow"],
      ["blue", null, "yellow"],
    ].forEach((d) => {
      expect(
        labelKeyValidation(d, {} as MultiSelectWidgetProps, _),
      ).toEqual({
        parsed: [],
        isValid: false,
        messages: [
          {
            name: "ValidationError",
            message: `Invalid entry at index: 1. This value does not evaluate to type: string`,
          },
        ],
      });
    });

    // boolean
    expect(
      labelKeyValidation(true, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: "value does not evaluate to type: string | Array<string>",
        },
      ],
    });

    // number
    expect(
      labelKeyValidation(1, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: "value does not evaluate to type: string | Array<string>",
        },
      ],
    });

    // object
    expect(
      labelKeyValidation({}, {} as MultiSelectWidgetProps, _),
    ).toEqual({
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: "value does not evaluate to type: string | Array<string>",
        },
      ],
    });
  });
});

describe("valueKeyValidation", () => {
  test("should test that empty values return error", () => {
    ["", undefined, null].forEach((d) => {
      expect(
        valueKeyValidation(
          d,
          {
            sourceData: [{ test: 1 }, { test: 2 }],
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any as MultiSelectWidgetProps,
          _,
        ),
      ).toEqual({
        parsed: "",
        isValid: false,
        messages: [
          {
            name: "ValidationError",
            message: `value does not evaluate to type: string | Array<string| number | boolean>`,
          },
        ],
      });
    });
  });

  test("should test that string values validates", () => {
    expect(
      valueKeyValidation(
        "test",
        {
          sourceData: [{ test: 1 }, { test: 2 }],
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      parsed: "test",
      isValid: true,
      messages: [],
    });
  });

  test("should test that array of string | number | boolean value validates", () => {
    [
      ["blue", 1, "yellow"],
      ["blue", true, "yellow"],
      [1, 2, 3],
    ].forEach((d) => {
      expect(
        valueKeyValidation(
          d,
          {
            sourceData: [{ test: 1 }, { test: 2 }],
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any as MultiSelectWidgetProps,
          _,
        ),
      ).toEqual({
        parsed: d,
        isValid: true,
        messages: [],
      });
    });
  });

  test("should test that all other values return error", () => {
    //invalid array entry
    [
      ["blue", {}, "yellow"],
      ["blue", [], "yellow"],
      ["blue", undefined, "yellow"],
      ["blue", null, "yellow"],
    ].forEach((d) => {
      expect(
        valueKeyValidation(
          d,
          {
            sourceData: [{ test: 1 }, { test: 2 }],
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any as MultiSelectWidgetProps,
          _,
        ),
      ).toEqual({
        parsed: [],
        isValid: false,
        messages: [
          {
            name: "ValidationError",
            message: `Invalid entry at index: 1. This value does not evaluate to type: string | number | boolean`,
          },
        ],
      });
    });

    expect(
      valueKeyValidation(
        ["blue", "blue", "yellow"],
        {
          sourceData: [{ test: 1 }, { test: 2 }],
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      parsed: ["blue", "blue", "yellow"],
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: `Duplicate values found, value must be unique`,
        },
      ],
    });

    expect(
      valueKeyValidation(
        "yellow",
        {
          sourceData: [{ test: 1 }, { test: 2 }],
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      parsed: "yellow",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message: `value key should be present in the source data`,
        },
      ],
    });

    // boolean
    expect(
      valueKeyValidation(
        true,
        {
          sourceData: [{ test: 1 }, { test: 2 }],
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message:
            "value does not evaluate to type: string | Array<string | number | boolean>",
        },
      ],
    });

    // number
    expect(
      valueKeyValidation(
        1,
        {
          sourceData: [{ test: 1 }, { test: 2 }],
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message:
            "value does not evaluate to type: string | Array<string | number | boolean>",
        },
      ],
    });

    // object
    expect(
      valueKeyValidation(
        {},
        {
          sourceData: [{ test: 1 }, { test: 2 }],
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as MultiSelectWidgetProps,
        _,
      ),
    ).toEqual({
      parsed: "",
      isValid: false,
      messages: [
        {
          name: "ValidationError",
          message:
            "value does not evaluate to type: string | Array<string | number | boolean>",
        },
      ],
    });
  });
});

describe("getLabelValueKeyOptions", () => {
  test("should test that keys are properly generated for valid values", () => {
    [
      {
        input: JSON.stringify([
          {
            "1": "",
            "2": "",
          },
          {
            "1": "",
            "2": "",
          },
        ]),
        output: [
          {
            label: "1",
            value: "1",
          },
          {
            label: "2",
            value: "2",
          },
        ],
      },
      {
        input: [
          {
            "1": "",
            "2": "",
          },
          {
            "1": "",
            "2": "",
          },
        ],
        output: [
          {
            label: "1",
            value: "1",
          },
          {
            label: "2",
            value: "2",
          },
        ],
      },
      {
        input: [
          {
            "1": "",
            "2": "",
          },
          {
            "3": "",
            "4": "",
          },
          {
            "1": "",
            "2": "",
            "3": "",
            "4": "",
          },
          "test",
          1,
          true,
          {},
          undefined,
          null,
        ],
        output: [
          {
            label: "1",
            value: "1",
          },
          {
            label: "2",
            value: "2",
          },
          {
            label: "3",
            value: "3",
          },
          {
            label: "4",
            value: "4",
          },
        ],
      },
    ].forEach((d) => {
      const widget = {};

      set(widget, `${EVAL_VALUE_PATH}.sourceData`, d.input);

      expect(getLabelValueKeyOptions(widget as WidgetProps)).toEqual(d.output);
    });
  });

  test("should test that empty array is generated for invalid values", () => {
    [[], "", null, undefined, {}, true, 1].forEach((d) => {
      const widget = {};

      set(widget, `${EVAL_VALUE_PATH}.sourceData`, d);

      expect(getLabelValueKeyOptions(widget as WidgetProps)).toEqual([]);
    });
  });
});

describe("getLabelValueAdditionalAutocompleteData", () => {
  test("should test autocompletObject is generated for valid value", () => {
    [
      {
        input: JSON.stringify([
          {
            "1": "",
            "2": "",
          },
          {
            "1": "",
            "2": "",
          },
        ]),
        output: {
          item: {
            1: "",
            2: "",
          },
        },
      },
      {
        input: [
          {
            "1": "",
            "2": "",
          },
          {
            "1": "",
            "2": "",
          },
        ],
        output: {
          item: {
            1: "",
            2: "",
          },
        },
      },
      {
        input: [
          {
            "1": "",
            "2": "",
          },
          {
            "3": "",
            "4": "",
            "5": "",
          },
          {
            "1": "",
            "2": "",
            "3": "",
            "4": "",
          },
          "test",
          1,
          true,
          {},
          undefined,
          null,
        ],
        output: {
          item: {
            1: "",
            2: "",
            3: "",
            4: "",
            5: "",
          },
        },
      },
    ].forEach((d) => {
      const widget = {};

      set(widget, `${EVAL_VALUE_PATH}.sourceData`, d.input);

      expect(
        getLabelValueAdditionalAutocompleteData(widget as WidgetProps),
      ).toEqual(d.output);
    });
  });

  test("should test that empty item is generated for invalid values", () => {
    [[], "", null, undefined, {}, true, 1].forEach((d) => {
      const widget = {};

      set(widget, `${EVAL_VALUE_PATH}.sourceData`, d);

      expect(
        getLabelValueAdditionalAutocompleteData(widget as WidgetProps),
      ).toEqual({
        item: {},
      });
    });
  });
});
