import _ from "lodash";

import { JSONFormWidgetProps } from "../..";
import { optionsValidation } from "./radioGroup";

/**
 * Note: If this test fails then it is an indication than the JSONForm
 * radio group field options validation doesn't comply with the radio group
 * widget's options validation due to the changes in the validation function.
 * Appropriates fixes has to be made in order for both the widgets to work.
 *
 * The above might not always be true but double checking never hurts.
 */
describe(".optionsValidation", () => {
  it("returns invalid when values are duplicate", () => {
    const input = [
      { label: "A", value: "A" },
      { label: "B", value: "A" },
    ];

    const expectedOutput = {
      isValid: false,
      parsed: [],
      messages: ["path:value must be unique. Duplicate values found"],
    };

    const response = optionsValidation(input, {} as JSONFormWidgetProps, _);

    expect(response).toEqual(expectedOutput);
  });

  it("returns invalid when label is missing", () => {
    const input = [{ value: "A" }, { label: "B", value: "A" }];

    const expectedOutput = {
      isValid: false,
      parsed: [],
      messages: ["Invalid entry at index: 0. Missing required key: label"],
    };

    const response = optionsValidation(input, {} as JSONFormWidgetProps, _);

    expect(response).toEqual(expectedOutput);
  });

  it("returns invalid when value has mix types", () => {
    const input = [
      { label: "A", value: "A" },
      { label: "B", value: 2 },
    ];
    const expectedOutput = {
      isValid: false,
      parsed: [],
      messages: ["All value properties in options must have the same type"],
    };

    const response = optionsValidation(input, {} as JSONFormWidgetProps, _);

    expect(response).toEqual(expectedOutput);
  });

  it("returns invalid when value has null or undefined", () => {
    const inputs = [
      [
        { label: "A", value: null },
        { label: "B", value: null },
      ],
      [
        { label: "A", value: undefined },
        { label: "B", value: undefined },
      ],
    ];

    const expectedOutput = {
      isValid: false,
      parsed: [],
      messages: [
        'This value does not evaluate to type Array<{ "label": "string", "value": "string" | number }>',
      ],
    };

    inputs.forEach((input) => {
      const response = optionsValidation(input, {} as JSONFormWidgetProps, _);

      expect(response).toEqual(expectedOutput);
    });
  });

  it("returns valid with valid options", () => {
    const inputs = [
      [
        { label: "A", value: "A" },
        { label: "B", value: "B" },
      ],
      [
        { label: "A", value: 1 },
        { label: "B", value: 2 },
      ],
    ];

    inputs.forEach((input) => {
      const response = optionsValidation(input, {} as JSONFormWidgetProps, _);
      const expectedOutput = {
        isValid: true,
        parsed: input,
        messages: [""],
      };

      expect(response).toEqual(expectedOutput);
    });
  });
});
