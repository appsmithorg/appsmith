import { showBindingPrompt } from "./BindingPromptHelper";

describe("Test to check conditons for showing binding prompt", () => {
  it("Show binding prompt", () => {
    const testCases = [
      { showEvaluatedValue: true, inputValue: "{" },
      { showEvaluatedValue: true, inputValue: "Some value" },
      { showEvaluatedValue: true, inputValue: "1" },
      { showEvaluatedValue: true, inputValue: "[1, 2, 3]" },
      { showEvaluatedValue: true, inputValue: "" },
      { showEvaluatedValue: true, inputValue: [1, 2, 3] },
      { showEvaluatedValue: true, inputValue: 1 },
      { showEvaluatedValue: true, inputValue: null },
      { showEvaluatedValue: true, inputValue: undefined },
    ];

    testCases.forEach((testCase) => {
      expect(
        showBindingPrompt(testCase.showEvaluatedValue, testCase.inputValue),
      ).toBeTruthy();
    });
  });

  it("Hide binding prompt", () => {
    const testCases = [
      { showEvaluatedValue: false, inputValue: "" },
      { showEvaluatedValue: false, inputValue: 1 },
      { showEvaluatedValue: false, inputValue: null },
      { showEvaluatedValue: false, inputValue: undefined },
      { showEvaluatedValue: true, inputValue: "Name: {{Widget.name}}" },
      { showEvaluatedValue: true, inputValue: "{{}}" },
    ];

    testCases.forEach((testCase) => {
      expect(
        showBindingPrompt(testCase.showEvaluatedValue, testCase.inputValue),
      ).toBeFalsy();
    });
  });
});
