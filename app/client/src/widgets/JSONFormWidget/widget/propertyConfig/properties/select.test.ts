import _ from "lodash";

import { JSONFormWidgetProps } from "../..";
import { defaultOptionValueValidation } from "./select";

describe(".defaultOptionValueValidation", () => {
  it("return undefined when input is undefined", () => {
    const input = undefined;
    const expectedOutput = {
      isValid: true,
      parsed: undefined,
      messages: [""],
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
      messages: [""],
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
      messages: [""],
    };

    const response = defaultOptionValueValidation(
      input,
      {} as JSONFormWidgetProps,
      _,
    );

    expect(response).toEqual(expectedOutput);
  });

  it("return value with string", () => {
    const input = "green";
    const expectedOutput = {
      isValid: true,
      parsed: "green",
      messages: [""],
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
      messages: [""],
    };

    const response = defaultOptionValueValidation(
      input,
      {} as JSONFormWidgetProps,
      _,
    );

    expect(response).toEqual(expectedOutput);
  });

  it("should return isValid false with invalid values", () => {
    const inputAndExpectedOutput = [
      [
        true,
        {
          isValid: false,
          parsed: {},
          messages: [
            'value should match: string | { "label": "label1", "value": "value1" }',
          ],
        },
      ],
      [
        {},
        {
          isValid: false,
          parsed: {},
          messages: [
            'value should match: string | { "label": "label1", "value": "value1" }',
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
            'value should match: string | { "label": "label1", "value": "value1" }',
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
            'value should match: string | { "label": "label1", "value": "value1" }',
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
            'value should match: string | { "label": "label1", "value": "value1" }',
          ],
        },
      ],
      [
        {},
        {
          isValid: false,
          parsed: {},
          messages: [
            'value should match: string | { "label": "label1", "value": "value1" }',
          ],
        },
      ],
      [
        [],
        {
          isValid: false,
          parsed: {},
          messages: [
            'value should match: string | { "label": "label1", "value": "value1" }',
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
