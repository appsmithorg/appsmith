import { JSAction } from "entities/JSCollection";
import { JSResponseState } from "./JSResponseView";

export const isHtml = (str: string) => {
  const fragment = document.createRange().createContextualFragment(str);

  // remove all non text nodes from fragment
  fragment
    .querySelectorAll("*")
    .forEach((el: any) => el.parentNode.removeChild(el));

  // if there is textContent, then its not a pure HTML
  return !(fragment.textContent || "").trim();
};

/**
 * Returns state of the JSResponseview editor component
 * @param currentFunction => Current function whose response is to be shown
 * @param isDirty => Object containing JS Object functions with parse errors
 * @param isExecuting => Object containing JS Object functions still executing
 * @param isSaving => Whether any entity is still saving in the application
 * @param responses => Object containing JS Object functions' responses
 * @returns => state of the JSResponseview editor component
 */
export function getJSResponseViewState(
  currentFunction: JSAction | null,
  isDirty: Record<string, boolean>,
  isExecuting: Record<string, boolean>,
  isSaving: boolean,
  responses: Record<string, any>,
): JSResponseState {
  if (!currentFunction) return JSResponseState.NoResponse;
  if (isExecuting[currentFunction.id] && isSaving)
    return JSResponseState.IsUpdating;
  if (isExecuting[currentFunction.id]) return JSResponseState.IsExecuting;
  if (
    !Object.prototype.hasOwnProperty.call(responses, ) &&
    !Object.prototype.hasOwnProperty.call(isExecuting, )
  )
    return JSResponseState.NoResponse;
  if (
    Object.prototype.hasOwnProperty.call(responses, ) &&
    isDirty[currentFunction.id]
  )
    return JSResponseState.IsDirty;

  if (
    Object.prototype.hasOwnProperty.call(responses, ) &&
    responses[currentFunction.id] === undefined
  )
    return JSResponseState.NoReturnValue;

  if (Object.prototype.hasOwnProperty.call(responses, ))
    return JSResponseState.ShowResponse;

  // Default state
  return JSResponseState.NoResponse;
}
