import { isString } from "lodash";
import { isDynamicValue } from "utils/DynamicBindingUtils";

export const showBindingPrompt = (
  showEvaluatedValue: boolean,
  inputValue: any,
  isHinterOpen: boolean,
): boolean => {
  const isDynamicInputValue = inputValue && isDynamicValue(inputValue);
  const lastCharacterOfSlash =
    inputValue && isString(inputValue) && inputValue.slice(-1);

  return (
    showEvaluatedValue &&
    (!isString(inputValue) ||
      (!inputValue && !isHinterOpen) ||
      (!isDynamicInputValue && lastCharacterOfSlash !== "/"))
  );
};
