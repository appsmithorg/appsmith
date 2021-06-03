import derivedProperty from "./derived";
import moment from "moment";
import _ from "lodash";

describe("Validates Derived Properties", () => {
  it("validates isValid method", () => {
    const { isValid } = derivedProperty;
    const inputs = [
      {
        isRequired: true,
        selectionType: "SINGLE_SELECT",
        selectedOption: "value1",
        selectedIndexArr: [],
      },
      {
        isRequired: true,
        selectionType: "MULTI_SELECT",
        selectedOption: undefined,
        selectedIndexArr: ["value1"],
      },
      {
        isRequired: true,
        selectionType: "SINGLE_SELECT",
        selectedOption: undefined,
        selectedIndexArr: [],
      },
      {
        isRequired: true,
        selectionType: "MULTI_SELECT",
        selectedOption: "value1",
        selectedIndexArr: [],
      },
    ];
    const outputs = [true, true, false, false];
    inputs.forEach((input, index) => {
      const result = isValid(input, moment, _);
      expect(result).toStrictEqual(outputs[index]);
    });
  });

  it("validates getSelectedOption method", () => {
    const { getSelectedOption } = derivedProperty;
    const inputs = [
      {
        selectionType: "SINGLE_SELECT",
        selectedOptionValue: "value2",
        defaultOptionValue: "value1",
        options: [
          {
            value: "value1",
            label: "Value 1",
          },
          {
            value: "value2",
            label: "Value 2",
          },
        ],
      },
      {
        selectionType: "SINGLE_SELECT",
        selectedOptionValue: undefined,
        defaultOptionValue: "value1",
        options: [
          {
            value: "value1",
            label: "Value 1",
          },
          {
            value: "value2",
            label: "Value 2",
          },
        ],
      },
      {
        selectionType: "MULTI_SELECT",
        selectedOptionValue: "value1",
        selectedIndexArr: ["value1"],
        options: [
          {
            value: "value1",
            label: "Value 1",
          },
          {
            value: "value2",
            label: "Value 2",
          },
        ],
      },
    ];
    const outputs = [
      {
        value: "value2",
        label: "Value 2",
      },
      {
        value: "value1",
        label: "Value 1",
      },
      undefined,
    ];
    inputs.forEach((input, index) => {
      const result = getSelectedOption(input, moment, _);
      expect(result).toStrictEqual(outputs[index]);
    });
  });
});
