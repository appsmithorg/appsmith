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

  it("validates getSelectedOptionArr method", () => {
    const { getSelectedOptionArr } = derivedProperty;
    const inputs = [
      {
        selectionType: "MULTI_SELECT",
        selectedOptionValueArr: ["value2"],
        defaultOptionValue: [],
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
        selectedOptionValueArr: undefined,
        defaultOptionValue: ["value1"],
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
    ];
    const outputs = [
      [
        {
          value: "value2",
          label: "Value 2",
        },
      ],
      [
        {
          value: "value1",
          label: "Value 1",
        },
      ],
      undefined,
    ];
    inputs.forEach((input, index) => {
      const result = getSelectedOptionArr(input, moment, _);
      expect(result).toStrictEqual(outputs[index]);
    });
  });

  it("validates getSelectedIndex method", () => {
    const { getSelectedIndex } = derivedProperty;
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
    const outputs = [1, 0, -1];
    inputs.forEach((input, index) => {
      const result = getSelectedIndex(input, moment, _);
      expect(result).toStrictEqual(outputs[index]);
    });
  });

  it("validates getSelectedIndexArr method", () => {
    const { getSelectedIndexArr } = derivedProperty;
    const inputs = [
      {
        selectionType: "MULTI_SELECT",
        selectedOptionValueArr: ["value2"],
        defaultOptionValue: ["value1"],
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
        selectedOptionValueArr: undefined,
        defaultOptionValue: ["value1"],
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
    ];
    const outputs = [[1], [0], []];
    inputs.forEach((input, index) => {
      const result = getSelectedIndexArr(input, moment, _);
      expect(result).toStrictEqual(outputs[index]);
    });
  });

  it("validates getSelectedValue method", () => {
    const { getSelectedValue } = derivedProperty;
    const inputs = [
      {
        selectionType: "SINGLE_SELECT",
        selectedOptionValue: "value1",
        defaultOptionValue: "value2",
      },
      {
        selectionType: "SINGLE_SELECT",
        selectedOptionValue: undefined,
        defaultOptionValue: "value2",
      },
      {
        selectionType: "MULTI_SELECT",
        selectedOptionValueArr: ["value1"],
        defaultOptionValue: [],
      },
      {
        selectionType: "MULTI_SELECT",
        selectedOptionValueArr: undefined,
        defaultOptionValue: ["value1", "value2"],
      },
    ];
    const outputs = ["value1", "value2", ["value1"], ["value1", "value2"]];
    inputs.forEach((input, index) => {
      const result = getSelectedValue(input, moment, _);
      expect(result).toStrictEqual(outputs[index]);
    });
  });

  it("validates getSelectedOptionValues method", () => {
    const { getSelectedOptionValues } = derivedProperty;
    const inputs = [
      {
        selectionType: "MULTI_SELECT",
        selectedOptionValueArr: ["value1"],
        defaultOptionValue: [],
      },
      {
        selectionType: "MULTI_SELECT",
        selectedOptionValueArr: undefined,
        defaultOptionValue: ["value1", "value2"],
      },
      {
        selectionType: "SINGLE_SELECT",
        selectedOptionValue: undefined,
        defaultOptionValue: "value2",
      },
    ];
    const outputs = [["value1"], ["value1", "value2"], []];
    inputs.forEach((input, index) => {
      const result = getSelectedOptionValues(input, moment, _);
      expect(result).toStrictEqual(outputs[index]);
    });
  });

  it("validates getSelectedOptionLabels method", () => {
    const { getSelectedOptionLabels } = derivedProperty;
    const inputs = [
      {
        selectionType: "MULTI_SELECT",
        selectedOptionValueArr: ["value1"],
        defaultOptionValue: [],
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
        selectedOptionValueArr: undefined,
        defaultOptionValue: ["value1", "value2"],
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
        defaultOptionValue: "value2",
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
    const outputs = [["Value 1"], ["Value 1", "Value 2"], []];
    inputs.forEach((input, index) => {
      const result = getSelectedOptionLabels(input, moment, _);
      expect(result).toStrictEqual(outputs[index]);
    });
  });

  it("validates getSelectedOptionLabel method", () => {
    const { getSelectedOptionLabel } = derivedProperty;
    const inputs = [
      {
        selectionType: "SINGLE_SELECT",
        selectedOptionValue: "value1",
        defaultOptionValue: undefined,
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
        defaultOptionValue: "value2",
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
        defaultOptionValue: undefined,
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
    const outputs = ["Value 1", "Value 2", ""];
    inputs.forEach((input, index) => {
      const result = getSelectedOptionLabel(input, moment, _);
      expect(result).toStrictEqual(outputs[index]);
    });
  });
});
