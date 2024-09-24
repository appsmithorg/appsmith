import type { AppState } from "ee/reducers";
import { createSelector } from "reselect";
import {
  getCurrentActions,
  getCanvasWidgets,
} from "ee/selectors/entitiesSelector";
import type { SIGNPOSTING_STEP } from "pages/Editor/FirstTimeUserOnboarding/Utils";
import { isBoolean, intersection } from "lodash";
import { getEvaluationInverseDependencyMap } from "./dataTreeSelectors";
import { getNestedValue } from "pages/Editor/utils";
import { getDependenciesFromInverseDependencies } from "components/editorComponents/Debugger/helpers";

// Signposting selectors

export const getFirstTimeUserOnboardingApplicationIds = (state: AppState) => {
  return state.ui.onBoarding.firstTimeUserOnboardingApplicationIds;
};

export const getFirstTimeUserOnboardingComplete = (state: AppState) => {
  return state.ui.onBoarding.firstTimeUserOnboardingComplete;
};

export const getFirstTimeUserOnboardingModal = (state: AppState) =>
  state.ui.onBoarding.showFirstTimeUserOnboardingModal;

export const getIsFirstTimeUserOnboardingEnabled = createSelector(
  (state: AppState) => state.entities.pageList.applicationId,
  getFirstTimeUserOnboardingApplicationIds,
  (currentApplicationId, applicationIds) => {
    return applicationIds.includes(currentApplicationId);
  },
);

export const getInOnboardingWidgetSelection = (state: AppState) =>
  state.ui.onBoarding.inOnboardingWidgetSelection;

export const getSignpostingStepState = (state: AppState) =>
  state.ui.onBoarding.stepState;
export const getSignpostingStepStateByStep = createSelector(
  getSignpostingStepState,
  (_state: AppState, step: SIGNPOSTING_STEP) => step,
  (stepState, step) => {
    return stepState.find((state) => state.step === step);
  },
);
export const getSignpostingUnreadSteps = createSelector(
  getSignpostingStepState,
  (stepState) => {
    if (!stepState.length) return [];

    return stepState.filter((state) => isBoolean(state.read) && !state.read);
  },
);
export const getSignpostingSetOverlay = (state: AppState) =>
  state.ui.onBoarding.setOverlay;
export const getSignpostingTooltipVisible = (state: AppState) =>
  state.ui.onBoarding.showSignpostingTooltip;
export const getIsAnonymousDataPopupVisible = (state: AppState) =>
  state.ui.onBoarding.showAnonymousDataPopup;
export const isWidgetActionConnectionPresent = createSelector(
  getCanvasWidgets,
  getCurrentActions,
  getEvaluationInverseDependencyMap,
  (widgets, actions, deps) => {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionLables = actions.map((action: any) => action.config.name);

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let isBindingAvailable = !!Object.values(widgets).find((widget: any) => {
      const depsConnections = getDependenciesFromInverseDependencies(
        deps,
        widget.widgetName,
      );

      return !!intersection(depsConnections?.directDependencies, actionLables)
        .length;
    });

    if (!isBindingAvailable) {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      isBindingAvailable = !!Object.values(widgets).find((widget: any) => {
        return (
          widget.dynamicTriggerPathList &&
          !!widget.dynamicTriggerPathList.find((path: { key: string }) => {
            return !!actionLables.find((label: string) => {
              const snippet = getNestedValue(widget, path.key);

              return snippet ? snippet.indexOf(`${label}.run`) > -1 : false;
            });
          })
        );
      });
    }

    return isBindingAvailable;
  },
);
