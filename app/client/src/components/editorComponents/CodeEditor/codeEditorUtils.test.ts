import { removeNewLineChars, getInputValue } from "./codeEditorUtils";

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
