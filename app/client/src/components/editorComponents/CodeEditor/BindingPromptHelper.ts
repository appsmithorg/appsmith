import { isString } from "lodash";
import { isDynamicValue } from "utils/DynamicBindingUtils";

export const showBindingPrompt = (
  showEvaluatedValue: boolean,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
