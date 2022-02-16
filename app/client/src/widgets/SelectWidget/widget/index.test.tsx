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

  it("should get tested with simple string", () => {
    const input = "green";

    expect(
      defaultOptionValueValidation(input, {} as SelectWidgetProps, _),
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
      defaultOptionValueValidation(input, {} as SelectWidgetProps, _),
    ).toEqual({
      isValid: true,
      parsed: {
        label: "green",
        value: "green",
      },
      messages: [""],
    });
  });

  it("should get tested with invalid values", () => {
    const testValues = [
      [
        undefined,
        {
          isValid: false,
          parsed: {},
          messages: [
            `value does not evaluate to type: string | { "label": "label1", "value": "value1" }`,
          ],
        },
      ],
      [
        null,
        {
          isValid: false,
          parsed: {},
          messages: [
            `value does not evaluate to type: string | { "label": "label1", "value": "value1" }`,
          ],
        },
      ],
      [
        [],
        {
          isValid: false,
          parsed: {},
          messages: [
            `value does not evaluate to type: string | { "label": "label1", "value": "value1" }`,
          ],
        },
      ],
      [
        true,
        {
          isValid: false,
          parsed: {},
          messages: [
            `value does not evaluate to type: string | { "label": "label1", "value": "value1" }`,
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
            `value does not evaluate to type: string | { "label": "label1", "value": "value1" }`,
          ],
        },
      ],
    ];

    testValues.forEach(([input, expected]) => {
      expect(
        defaultOptionValueValidation(input, {} as SelectWidgetProps, _),
      ).toEqual(expected);
    });
  });
});
