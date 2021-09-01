import { isString } from "lodash";

export const showBindingPrompt = (
  showEvaluatedValue: boolean,
  inputValue: any,
  isHinterOpen: boolean,
): boolean => {
  return (
    showEvaluatedValue &&
    (!isString(inputValue) ||
      (!inputValue && !isHinterOpen) ||
      (!inputValue?.includes("{{") && !inputValue?.includes("/")))
  );
};
