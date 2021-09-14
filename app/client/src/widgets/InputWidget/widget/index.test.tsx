import { defaultValueValidation, InputWidgetProps } from "./index";
import _ from "lodash";

describe("Defaut value validations", () => {
  it("For number type input", () => {
    const props: InputWidgetProps = {
      inputType: "NUMBER",
      validation: true,
      text: "",
      label: "",
      inputValidators: [],
      isValid: true,
      widgetId: "23424",
      widgetName: "input1",
      renderMode: "CANVAS",
      type: "INPUT_WIDGET",
      parentColumnSpace: 71.75,
      parentRowSpace: 38,
      leftColumn: 0,
      rightColumn: 100,
      topRow: 0,
      version: 1,
      bottomRow: 2,
      isLoading: false,
    };
    const output1 = defaultValueValidation("", props, _);
    expect(output1.parsed).toBe(undefined);
    const output2 = defaultValueValidation(100, props, _);
    expect(output2.parsed).toBe(100);
  });
  it("For integers type input", () => {
    const props: InputWidgetProps = {
      inputType: "INTEGER",
      validation: true,
      text: "",
      label: "",
      inputValidators: [],
      isValid: true,
      widgetId: "23424",
      widgetName: "input1",
      renderMode: "CANVAS",
      type: "INPUT_WIDGET",
      parentColumnSpace: 71.75,
      parentRowSpace: 38,
      leftColumn: 0,
      rightColumn: 100,
      topRow: 0,
      version: 1,
      bottomRow: 2,
      isLoading: false,
    };
    const output1 = defaultValueValidation(undefined, props, _);
    expect(output1.parsed).toBe(undefined);
    const output2 = defaultValueValidation(100, props, _);
    expect(output2.parsed).toBe(100);
  });

  it("For currency type input", () => {
    const props: InputWidgetProps = {
      inputType: "CURRENCY",
      validation: true,
      text: "",
      label: "",
      inputValidators: [],
      isValid: true,
      widgetId: "23424",
      widgetName: "input1",
      renderMode: "CANVAS",
      type: "INPUT_WIDGET",
      parentColumnSpace: 71.75,
      parentRowSpace: 38,
      leftColumn: 0,
      rightColumn: 100,
      topRow: 0,
      version: 1,
      bottomRow: 2,
      isLoading: false,
    };
    const output1 = defaultValueValidation(undefined, props, _);
    expect(output1.parsed).toBe(0);
    const output2 = defaultValueValidation(100, props, _);
    expect(output2.parsed).toBe(100);
  });
});
