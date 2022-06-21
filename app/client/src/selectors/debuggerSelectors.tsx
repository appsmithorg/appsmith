import { matchDatasourcePath } from "constants/routes";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { AppState } from "reducers";
import { createSelector } from "reselect";
import { isWidget } from "workers/evaluationUtils";
import { getDataTree } from "./dataTreeSelectors";
export const getDebuggerErrors = (state: AppState) => state.ui.debugger.errors;
export const hideErrors = (state: AppState) => state.ui.debugger.hideErrors;
export const getFilteredErrors = createSelector(
  getDebuggerErrors,
  hideErrors,
  getDataTree,
  (errors, hideErrors, dataTree: DataTree) => {
    if (hideErrors) return {};

    const filteredErrors = Object.fromEntries(
      Object.entries(errors).filter(([, error]) => {
        const entity = error?.source?.name && dataTree[error.source.name];
        if (entity && isWidget(entity) && !entity.isVisible) {
          return false;
        }
        return true;
      }),
    );
    console.log("my errors", errors, filteredErrors);
    return filteredErrors;
  },
);
export const getCurrentDebuggerTab = (state: AppState) =>
  state.ui.debugger.currentTab;

export const getMessageCount = createSelector(getFilteredErrors, (errors) => {
  const errorKeys = Object.keys(errors);
  const warningsCount = errorKeys.filter((key: string) =>
    key.includes("warning"),
  ).length;
  const errorsCount = errorKeys.length - warningsCount;
  return { errors: errorsCount, warnings: warningsCount };
});

export const hideDebuggerIconSelector = () =>
  matchDatasourcePath(window.location.pathname);
