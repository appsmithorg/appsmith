import { defaultValueValidation, InputWidgetProps } from "./index";
import _ from "lodash";

describe("#defaultValueValidation", () => {
  const defaultInputWidgetProps: InputWidgetProps = {
    bottomRow: 2,
    inputType: "NUMBER",
    inputValidators: [],
    isLoading: false,
    isValid: true,
    label: "",
    leftColumn: 0,
    parentColumnSpace: 71.75,
    parentRowSpace: 38,
    renderMode: "CANVAS",
    rightColumn: 100,
    text: "",
    topRow: 0,
    type: "INPUT_WIDGET",
    validation: true,
    version: 1,
    widgetId: "23424",
    widgetName: "input1",
  };

  const inputs = [
    "",
    "   ",
    "0",
    "123",
    "-23",
    "0.000001",
    -23,
    0,
    100,
    "&*()(",
    "abcd",
    "123 123",
  ];
  const expectedOutputs = [
    { isValid: true, parsed: undefined, messages: [""] },
    { isValid: true, parsed: undefined, messages: [""] },
    { isValid: true, parsed: 0, messages: [""] },
    { isValid: true, parsed: 123, messages: [""] },
    { isValid: true, parsed: -23, messages: [""] },
    { isValid: true, parsed: 0.000001, messages: [""] },
    { isValid: true, parsed: -23, messages: [""] },
    { isValid: true, parsed: 0, messages: [""] },
    { isValid: true, parsed: 100, messages: [""] },
    {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    },
    {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    },
    {
      isValid: false,
      parsed: undefined,
      messages: ["This value must be a number"],
    },
  ];

  it("validates correctly for Number type", () => {
    const props = {
      ...defaultInputWidgetProps,
    };

    inputs.forEach((input, index) => {
      const response = defaultValueValidation(input, props, _);

      expect(response).toStrictEqual(expectedOutputs[index]);
    });
  });

  it("validates correctly for Integer type", () => {
    const props = {
      ...defaultInputWidgetProps,
      inputType: "INTEGER",
    };

    inputs.forEach((input, index) => {
      const response = defaultValueValidation(input, props, _);

      expect(response).toStrictEqual(expectedOutputs[index]);
    });
  });

  it("validates correctly for Currency type", () => {
    const props = {
      ...defaultInputWidgetProps,
      inputType: "CURRENCY",
    };

    inputs.forEach((input, index) => {
      const response = defaultValueValidation(input, props, _);

      expect(response).toStrictEqual(expectedOutputs[index]);
    });
  });

  it("validates correctly for Phone Number type", () => {
    const props = {
      ...defaultInputWidgetProps,
      inputType: "PHONE_NUMBER",
    };

    const expectedPhoneNumberOutputs = [
      { isValid: true, parsed: "", messages: [""] },
      { isValid: true, parsed: "   ", messages: [""] },
      { isValid: true, parsed: "0", messages: [""] },
      { isValid: true, parsed: "123", messages: [""] },
      {
        isValid: false,
        parsed: undefined,
        messages: ["This value must be a valid phone number format"],
      },
      {
        isValid: false,
        parsed: undefined,
        messages: ["This value must be a valid phone number format"],
      },
      {
        isValid: false,
        parsed: undefined,
        messages: ["This value must be a valid phone number format"],
      },
      { isValid: false, parsed: "0", messages: [""] }, // input is number
      { isValid: false, parsed: "100", messages: [""] }, // input is number
      {
        isValid: false,
        parsed: undefined,
        messages: ["This value must be a valid phone number format"],
      },
      {
        isValid: false,
        parsed: undefined,
        messages: ["This value must be a valid phone number format"],
      },
      { isValid: true, parsed: "123 123", messages: [""] },
    ];

    inputs.forEach((input, index) => {
      const response = defaultValueValidation(input, props, _);
      expect(response).toStrictEqual(expectedPhoneNumberOutputs[index]);
    });
  });
});
