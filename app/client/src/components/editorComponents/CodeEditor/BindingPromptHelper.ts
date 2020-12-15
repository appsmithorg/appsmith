import { isString } from "lodash";

export const showBindingPrompt = (
  showEvaluatedValue: boolean,
  inputValue: any,
): boolean => {
  return (
    showEvaluatedValue &&
    (!isString(inputValue) || !inputValue?.includes("{{") || !inputValue)
  );
};
