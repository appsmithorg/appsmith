import type { JSAction } from "entities/JSCollection";
import type { JSActionDropdownOption } from "./types";
import { NO_FUNCTION_DROPDOWN_OPTION } from "./constants";

export const convertJSActionsToDropdownOptions = (
  JSActions: JSAction[],
): JSActionDropdownOption[] => {
  return JSActions.map(convertJSActionToDropdownOption);
};
export const convertJSActionToDropdownOption = (
  JSAction: JSAction,
): JSActionDropdownOption => ({
  label: JSAction.name,
  value: JSAction.id,
  data: JSAction,
});
/**
 * Returns dropdown option based on priority and availability
 */
export const getJSActionOption = (
  activeJSAction: JSAction | null,
  jsActions: JSAction[],
): JSActionDropdownOption => {
  let jsActionOption: JSActionDropdownOption = NO_FUNCTION_DROPDOWN_OPTION;

  if (activeJSAction) {
    jsActionOption = convertJSActionToDropdownOption(activeJSAction);
  } else if (jsActions.length) {
    jsActionOption = convertJSActionToDropdownOption(jsActions[0]);
  }

  return jsActionOption;
};
