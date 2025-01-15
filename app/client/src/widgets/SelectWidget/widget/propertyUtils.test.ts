import type { LoDashStatic } from "lodash";
import { set } from "lodash";
import _ from "lodash";
import { EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { SelectWidgetProps } from ".";
import {
  defaultOptionValueValidation,
  labelKeyValidation,
  getLabelValueAdditionalAutocompleteData,
  getLabelValueKeyOptions,
  valueKeyValidation,
} from "./propertyUtils";

describe("defaultOptionValueValidation - ", () => {
  it("should get tested with simple string", () => {
    const input = "";

    expect(
      defaultOptionValueValidation(input, {} as SelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: "",
      messages: [{ name: "", message: "" }],
    });
  });
  it("should get tested with number", () => {
    const testValues = [
      [
        "1",
        {
          isValid: true,
          parsed: "1",
          messages: [{ name: "", message: "" }],
        },
      ],
      [
        1,
        {
          isValid: true,
          parsed: 1,
          messages: [{ name: "", message: "" }],
        },
      ],
    ];

    testValues.forEach(([input, expected]) => {
      expect(
        defaultOptionValueValidation(
          input,
          {
            options: [
              { label: "Blue", value: "1" },
              { label: "Green", value: 1 },
            ],
            serverSideFiltering: false,
          } as SelectWidgetProps,
          _,
        ),
      ).toEqual(expected);
    });
  });

  it("should get tested with simple string", () => {
    const input = "green";

    expect(
      defaultOptionValueValidation(
        input,
        {
          options: [{ label: "Green", value: "green" }],
          serverSideFiltering: false,
        } as SelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: "green",
      messages: [{ name: "", message: "" }],
    });
  });

  it("should get tested with simple string with stringified options", () => {
    const input = "green";

    expect(
      defaultOptionValueValidation(
        input,
        {
          options: JSON.stringify([
            { label: "Green", value: "green" },
          ]) as unknown,
          serverSideFiltering: false,
        } as SelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: "green",
      messages: [{ name: "", message: "" }],
    });
  });

  it("should get tested with plain object", () => {
    const input = {
      label: "green",
      value: "green",
    };

    expect(
      defaultOptionValueValidation(
        input,
        {
          options: [{ label: "Green", value: "green" }],
          serverSideFiltering: false,
        } as SelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: true,
      parsed: {
        label: "green",
        value: "green",
      },
      messages: [{ name: "", message: "" }],
    });
  });
  it("should get tested with valid strings", () => {
    const testValues = [
      [
        "undefined",
        {
          isValid: true,
          parsed: "undefined",
          messages: [{ name: "", message: "" }],
        },
      ],
      [
        "null",
        {
          isValid: true,
          parsed: "null",
          messages: [{ name: "", message: "" }],
        },
      ],
      [
        "true",
        {
          isValid: true,
          parsed: "true",
          messages: [{ name: "", message: "" }],
        },
      ],
    ];

    testValues.forEach(([input, expected]) => {
      expect(
        defaultOptionValueValidation(
          input,
          {
            options: [
              { label: "null", value: "null" },
              { label: "undefined", value: "undefined" },
              { label: "true", value: "true" },
            ],
            serverSideFiltering: false,
          } as SelectWidgetProps,
          _,
        ),
      ).toEqual(expected);
    });
  });

  it("should get tested with invalid values", () => {
    const testValues = [
      [
        undefined,
        {
          isValid: false,
          parsed: undefined,
          messages: [
            {
              name: "TypeError",
              message: `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            },
          ],
        },
      ],
      [
        null,
        {
          isValid: false,
          parsed: undefined,
          messages: [
            {
              name: "TypeError",
              message: `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            },
          ],
        },
      ],
      [
        [],
        {
          isValid: false,
          parsed: undefined,
          messages: [
            {
              name: "TypeError",
              message: `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            },
          ],
        },
      ],
      [
        true,
        {
          isValid: false,
          parsed: undefined,
          messages: [
            {
              name: "TypeError",
              message: `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            },
          ],
        },
      ],
      [
        {
          label: "green",
        },
        {
          isValid: false,
          parsed: undefined,
          messages: [
            {
              name: "TypeError",
              message: `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
            },
          ],
        },
      ],
    ];

    testValues.forEach(([input, expected]) => {
      expect(
        defaultOptionValueValidation(
          input,
          {
            options: [
              { label: "null", value: "null" },
              { label: "undefined", value: "undefined" },
              { label: "true", value: "true" },
            ],
            serverSideFiltering: false,
          } as SelectWidgetProps,
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
        labelKeyValidation(d, {} as SelectWidgetProps, _),
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
      labelKeyValidation("test", {} as SelectWidgetProps, _),
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
        {} as SelectWidgetProps,
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
        labelKeyValidation(d, {} as SelectWidgetProps, _),
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
      labelKeyValidation(true, {} as SelectWidgetProps, _),
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
      labelKeyValidation(1, {} as SelectWidgetProps, _),
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
      labelKeyValidation({}, {} as SelectWidgetProps, _),
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
        valueKeyValidation(d, {} as SelectWidgetProps, _),
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { sourceData: [{ test: 1 }, { test: 2 }] } as any as SelectWidgetProps,
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
          } as any as SelectWidgetProps,
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
          } as any as SelectWidgetProps,
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

    //duplicate array entry
    expect(
      valueKeyValidation(
        ["blue", "blue", "yellow"],
        {
          sourceData: [{ test: 1 }, { test: 2 }],
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any as SelectWidgetProps,
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
        } as any as SelectWidgetProps,
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { sourceData: [{ test: 1 }, { test: 2 }] } as any as SelectWidgetProps,
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { sourceData: [{ test: 1 }, { test: 2 }] } as any as SelectWidgetProps,
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
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { sourceData: [{ test: 1 }, { test: 2 }] } as any as SelectWidgetProps,
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
