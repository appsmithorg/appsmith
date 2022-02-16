import _ from "lodash";

import { JSONFormWidgetProps } from "../..";
import { defaultOptionValueValidation } from "./multiSelect";

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

  it("return undefined with empty string", () => {
    const input = "";
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

  it("return value with array of string", () => {
    const input = ["green", "red"];
    const expectedOutput = {
      isValid: true,
      parsed: ["green", "red"],
      messages: [""],
    };

    const response = defaultOptionValueValidation(
      input,
      {} as JSONFormWidgetProps,
      _,
    );

    expect(response).toEqual(expectedOutput);
  });

  it("return value with csv", () => {
    const input = "green, red";
    const expectedOutput = {
      isValid: true,
      parsed: ["green", "red"],
      messages: [""],
    };

    const response = defaultOptionValueValidation(
      input,
      {} as JSONFormWidgetProps,
      _,
    );

    expect(response).toEqual(expectedOutput);
  });

  it("return value with stringified array of string", () => {
    const input = `["green", "red"]`;
    const expectedOutput = {
      isValid: true,
      parsed: ["green", "red"],
      messages: [""],
    };

    const response = defaultOptionValueValidation(
      input,
      {} as JSONFormWidgetProps,
      _,
    );

    expect(response).toEqual(expectedOutput);
  });

  it("return value with stringified array json", () => {
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

    const expectedOutput = {
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
          messages: ["value must be unique. Duplicate values found"],
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
          messages: ["value must be unique. Duplicate values found"],
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
          parsed: [],
          messages: [
            "value should match: Array<string | number> | Array<{label: string, value: string | number}>",
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
