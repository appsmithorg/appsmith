import _ from "lodash";

import type { JSONFormWidgetProps } from "../..";
import { defaultOptionValueValidation } from "./select";

describe(".defaultOptionValueValidation", () => {
  describe("handling falsey values", () => {
    it("return undefined when input is undefined", () => {
      const input = undefined;
      const expectedOutput = {
        isValid: true,
        parsed: undefined,
        messages: [{ name: "", message: "" }],
      };

      const response = defaultOptionValueValidation(
        input,
        {} as JSONFormWidgetProps,
        _,
      );

      expect(response).toEqual(expectedOutput);
    });

    it("return null when input is null", () => {
      const input = null;
      const expectedOutput = {
        isValid: true,
        parsed: null,
        messages: [{ name: "", message: "" }],
      };

      const response = defaultOptionValueValidation(
        input,
        {} as JSONFormWidgetProps,
        _,
      );

      expect(response).toEqual(expectedOutput);
    });

    it("return empty string with empty string", () => {
      const input = "";
      const expectedOutput = {
        isValid: true,
        parsed: "",
        messages: [{ name: "", message: "" }],
      };

      const response = defaultOptionValueValidation(
        input,
        {} as JSONFormWidgetProps,
        _,
      );

      expect(response).toEqual(expectedOutput);
    });
  });

  describe("handling truthy values", () => {
    it("return value with string", () => {
      const input = "green";
      const expectedOutput = {
        isValid: true,
        parsed: "green",
        messages: [{ name: "", message: "" }],
      };

      const response = defaultOptionValueValidation(
        input,
        {} as JSONFormWidgetProps,
        _,
      );

      expect(response).toEqual(expectedOutput);
    });

    it("return value with stringified json", () => {
      const input = `
      {
        "label": "green",
        "value": "green"
      }
    `;

      const expectedOutput = {
        isValid: true,
        parsed: {
          label: "green",
          value: "green",
        },
        messages: [{ name: "", message: "" }],
      };

      const response = defaultOptionValueValidation(
        input,
        {} as JSONFormWidgetProps,
        _,
      );

      expect(response).toEqual(expectedOutput);
    });

    it("Edge Case: For very long numbers passed as string, don't parse it as number", () => {
      const input =
        "123456789012345678901234567890123456789012345678901234567890";
      const expectedOutput = {
        isValid: true,
        parsed: "123456789012345678901234567890123456789012345678901234567890",
        messages: [{ name: "", message: "" }],
      };

      const response = defaultOptionValueValidation(
        input,
        {} as JSONFormWidgetProps,
        _,
      );

      expect(response).toEqual(expectedOutput);
    });
  });

  it("should return isValid false with invalid values", () => {
    const inputAndExpectedOutput = [
      [
        true,
        {
          isValid: false,
          parsed: {},
          messages: [
            {
              name: "TypeError",
              message:
                'value should match: string | { "label": "label1", "value": "value1" }',
            },
          ],
        },
      ],
      [
        {},
        {
          isValid: false,
          parsed: {},
          messages: [
            {
              name: "TypeError",
              message:
                'value should match: string | { "label": "label1", "value": "value1" }',
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
          "blue",
        ],
        {
          isValid: false,
          parsed: {},
          messages: [
            {
              name: "TypeError",
              message:
                'value should match: string | { "label": "label1", "value": "value1" }',
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
          parsed: {},
          messages: [
            {
              name: "TypeError",
              message:
                'value should match: string | { "label": "label1", "value": "value1" }',
            },
          ],
        },
      ],
      [
        {
          value: "green",
        },
        {
          isValid: false,
          parsed: {},
          messages: [
            {
              name: "TypeError",
              message:
                'value should match: string | { "label": "label1", "value": "value1" }',
            },
          ],
        },
      ],
      [
        {},
        {
          isValid: false,
          parsed: {},
          messages: [
            {
              name: "TypeError",
              message:
                'value should match: string | { "label": "label1", "value": "value1" }',
            },
          ],
        },
      ],
      [
        [],
        {
          isValid: false,
          parsed: {},
          messages: [
            {
              name: "TypeError",
              message:
                'value should match: string | { "label": "label1", "value": "value1" }',
            },
          ],
        },
      ],
    ];

    inputAndExpectedOutput.forEach(([input, expected]) => {
      const response = defaultOptionValueValidation(
        input,
        {} as JSONFormWidgetProps,
        _,
      );

      expect(response).toEqual(expected);
    });
  });
});
