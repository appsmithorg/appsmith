import { LoDashStatic, set } from "lodash";
import _ from "lodash";
import { EVAL_VALUE_PATH } from "utils/DynamicBindingUtils";
import type { WidgetProps } from "widgets/BaseWidget";
import type { SelectWidgetProps } from ".";
import {
  labelKeyValidation,
  labelValueAdditionalAutocompleteData,
  labelValueKeyOptions,
  valueKeyValidation,
} from "./propertyUtils";

describe("labelKeyValidation", () => {
  test("should test that empty values return error", () => {
    ["", undefined, null].forEach((d) => {
      expect(
        labelKeyValidation(d, {} as SelectWidgetProps, _ as LoDashStatic),
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
      labelKeyValidation("test", {} as SelectWidgetProps, _ as LoDashStatic),
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
        _ as LoDashStatic,
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
        labelKeyValidation(d, {} as SelectWidgetProps, _ as LoDashStatic),
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
      labelKeyValidation(true, {} as SelectWidgetProps, _ as LoDashStatic),
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
      labelKeyValidation(1, {} as SelectWidgetProps, _ as LoDashStatic),
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
      labelKeyValidation({}, {} as SelectWidgetProps, _ as LoDashStatic),
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
        valueKeyValidation(d, {} as SelectWidgetProps, _ as LoDashStatic),
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
      valueKeyValidation("test", {} as SelectWidgetProps, _ as LoDashStatic),
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
        valueKeyValidation(d, {} as SelectWidgetProps, _ as LoDashStatic),
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
        valueKeyValidation(d, {} as SelectWidgetProps, _ as LoDashStatic),
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

    // boolean
    expect(
      valueKeyValidation(true, {} as SelectWidgetProps, _ as LoDashStatic),
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
      valueKeyValidation(1, {} as SelectWidgetProps, _ as LoDashStatic),
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
      valueKeyValidation({}, {} as SelectWidgetProps, _ as LoDashStatic),
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

describe("labelValueKeyOptions", () => {
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

      expect(labelValueKeyOptions(widget as WidgetProps)).toEqual(d.output);
    });
  });

  test("should test that empty array is generated for invalid values", () => {
    [[], "", null, undefined, {}, true, 1].forEach((d) => {
      const widget = {};

      set(widget, `${EVAL_VALUE_PATH}.sourceData`, d);

      expect(labelValueKeyOptions(widget as WidgetProps)).toEqual([]);
    });
  });
});

describe("labelValueAdditionalAutocompleteData", () => {
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
        labelValueAdditionalAutocompleteData(widget as WidgetProps),
      ).toEqual(d.output);
    });
  });

  test("should test that empty item is generated for invalid values", () => {
    [[], "", null, undefined, {}, true, 1].forEach((d) => {
      const widget = {};

      set(widget, `${EVAL_VALUE_PATH}.sourceData`, d);

      expect(
        labelValueAdditionalAutocompleteData(widget as WidgetProps),
      ).toEqual({
        item: {},
      });
    });
  });
});
