import {
  removeNewLineChars,
  getInputValue,
  removeNewLineCharsIfRequired,
} from "./codeEditorUtils";
import { EditorSize } from "./EditorConfig";

describe("remove new line code", () => {
  it("removed new lines", () => {
    const input = `ab\ncd`;
    const output = "abcd";

    expect(removeNewLineChars(input)).toEqual(output);
  });
});

describe("input has to be in string", () => {
  it("convert input value into string", () => {
    const inputObject = {
      name: "apeksha",
      lastname: "bhosale",
    };
    const outputOfObject = getInputValue(inputObject);

    expect(typeof outputOfObject).toEqual("string");

    const inputNumber = 1234;
    const outputOfNumber = getInputValue(inputNumber);

    expect(typeof outputOfNumber).toEqual("string");

    const inputString = "abcd";
    const outputOfString = getInputValue(inputString);

    expect(typeof outputOfString).toEqual("string");
  });
});

describe("Bug 18709: remove new line code if required", () => {
  it("dont remove new lines in case of header/param values", () => {
    const input = `{{\nInput1.text\n}}`;
    const output = "{{\nInput1.text\n}}";

    expect(
      removeNewLineCharsIfRequired(input, EditorSize.COMPACT_RETAIN_FORMATTING),
    ).toEqual(output);
  });

  it("remove new lines if required", () => {
    const input = `{{\nInput1.text\n}}`;
    const output = "{{Input1.text}}";

    expect(removeNewLineCharsIfRequired(input, EditorSize.COMPACT)).toEqual(
      output,
    );
  });
});
