import { ActionExecutionContext } from "entities/Action";
import { executePageUnloadActions } from "actions/pluginActionActions";
import { getIsExecutingPageUnloadActions } from "selectors/editorSelectors";
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

/**
 * Check if page unload actions are currently executing
 * @returns boolean indicating if execution is in progress
 */
export const isPageUnloadActionsExecuting = (): boolean => {
  const state = store.getState();

  return getIsExecutingPageUnloadActions(state);
};

/**
 * Wait for page unload actions to complete execution
 * @returns Promise that resolves when execution is finished
 */
export const waitForPageUnloadActionsToComplete = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (!isPageUnloadActionsExecuting()) {
      resolve();

      return;
    }

    const unsubscribe = store.subscribe(() => {
      if (!isPageUnloadActionsExecuting()) {
        unsubscribe();
        resolve();
      }
    });
  });
};
