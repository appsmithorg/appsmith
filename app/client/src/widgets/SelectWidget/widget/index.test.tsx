import _ from "lodash";
import { SelectWidgetProps, defaultOptionValueValidation } from ".";

describe("defaultOptionValueValidation - ", () => {
  it("should get tested with simple string", () => {
    const input = "";

    expect(
      defaultOptionValueValidation(input, {} as SelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: "",
      messages: [""],
    });
  });
  it("should get tested with number", () => {
    const testValues = [
      [
        "1",
        {
          isValid: true,
          parsed: "1",
          messages: [""],
        },
      ],
      [
        1,
        {
          isValid: true,
          parsed: 1,
          messages: [""],
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
      messages: [""],
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
      messages: [""],
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
      messages: [""],
    });
  });
  it("should get tested with valid strings", () => {
    const testValues = [
      [
        "undefined",
        {
          isValid: true,
          parsed: "undefined",
          messages: [""],
        },
      ],
      [
        "null",
        {
          isValid: true,
          parsed: "null",
          messages: [""],
        },
      ],
      [
        "true",
        {
          isValid: true,
          parsed: "true",
          messages: [""],
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
            `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
          ],
        },
      ],
      [
        null,
        {
          isValid: false,
          parsed: undefined,
          messages: [
            `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
          ],
        },
      ],
      [
        [],
        {
          isValid: false,
          parsed: undefined,
          messages: [
            `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
          ],
        },
      ],
      [
        true,
        {
          isValid: false,
          parsed: undefined,
          messages: [
            `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
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
            `value does not evaluate to type: string | number | { "label": "label1", "value": "value1" }`,
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

  it("Should get tested with options when serverSideFiltering is false ", () => {
    const input = "YELLOW";

    expect(
      defaultOptionValueValidation(
        input,
        {
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
          ],
          serverSideFiltering: false,
        } as SelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: false,
      parsed: "YELLOW",
      messages: [
        "Default value is missing in options. Please update the value.",
      ],
    });
  });

  it("Should get tested with options when serverSideFiltering is true ", () => {
    const input = "YELLOW";

    expect(
      defaultOptionValueValidation(
        input,
        {
          options: [
            { label: "Blue", value: "BLUE" },
            { label: "Green", value: "GREEN" },
          ],
          serverSideFiltering: true,
        } as SelectWidgetProps,
        _,
      ),
    ).toEqual({
      isValid: false,
      parsed: "YELLOW",
      messages: [
        "Default value is missing in options. Please use {label : <string | num>, value : < string | num>} format to show default for server side data.",
      ],
    });
  });
});
