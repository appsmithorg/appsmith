import { ActionExecutionContext } from "entities/Action";
import { executePageUnloadActions } from "actions/pluginActionActions";
import store from "store";

/**
 * Utility function to trigger page unload actions
 * @param actionExecutionContext - Optional context for the action execution
 */
export const triggerPageUnloadActions = (
  actionExecutionContext?: ActionExecutionContext,
) => {
  store.dispatch(executePageUnloadActions(actionExecutionContext));
};

/**
 * Default trigger for page unload actions with PAGE_UNLOAD context
 */
export const triggerDefaultPageUnloadActions = () => {
  triggerPageUnloadActions(ActionExecutionContext.PAGE_UNLOAD);
};
