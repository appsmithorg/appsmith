import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getApplicationLastDeployedAt,
  getCurrentPageId,
} from "selectors/editorSelectors";
import {
  getCanvasWidgets,
  getPageActions,
  getSavedDatasources,
} from "ee/selectors/entitiesSelector";
import { SIGNPOSTING_STEP } from "./Utils";
import {
  getFirstTimeUserOnboardingComplete,
  isWidgetActionConnectionPresent,
} from "selectors/onboardingSelectors";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { signpostingStepUpdateInit } from "actions/onboardingActions";

const useStatusListener = () => {
  const datasources = useSelector(getSavedDatasources);
  const pageId = useSelector(getCurrentPageId);
  const actions = useSelector(getPageActions(pageId));
  const widgets = useSelector(getCanvasWidgets);
  const isConnectionPresent = useSelector(isWidgetActionConnectionPresent);
  const isDeployed = !!useSelector(getApplicationLastDeployedAt);
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );
  const dispatch = useDispatch();

  let percentage = 0;

  if (datasources.length || actions.length) {
    percentage += 20;
  }

  if (actions.length) {
    percentage += 20;
  }

  if (Object.keys(widgets).length > 1) {
    percentage += 20;
  }

  if (isConnectionPresent) {
    percentage += 20;
  }

  if (isDeployed) {
    percentage += 20;
  }

  useEffect(() => {
    dispatch(
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.CONNECT_A_DATASOURCE,
        completed: !!(datasources.length || actions.length),
      }),
    );
  }, [datasources.length, actions.length]);

  useEffect(() => {
    dispatch(
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.CREATE_A_QUERY,
        completed: !!actions.length,
      }),
    );
  }, [actions.length]);

  useEffect(() => {
    dispatch(
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.ADD_WIDGETS,
        completed: Object.keys(widgets).length > 1,
      }),
    );
  }, [Object.keys(widgets).length]);

  useEffect(() => {
    dispatch(
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.CONNECT_DATA_TO_WIDGET,
        completed: isConnectionPresent,
      }),
    );
  }, [isConnectionPresent]);

  useEffect(() => {
    dispatch(
      signpostingStepUpdateInit({
        step: SIGNPOSTING_STEP.DEPLOY_APPLICATIONS,
        completed: isDeployed,
      }),
    );
  }, [isDeployed]);

  useEffect(() => {
    if (percentage === 100 && !isFirstTimeUserOnboardingComplete) {
      dispatch({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_COMPLETE,
        payload: true,
      });
    }
  }, [percentage, isFirstTimeUserOnboardingComplete]);
};

export function OnboardingStatusbar() {
  useStatusListener();

  return null;
}

export default OnboardingStatusbar;
