import { OnboardingStep } from "constants/OnboardingConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getHelperConfig } from "sagas/OnboardingSagas";
import { getQueryParams } from "utils/AppsmithUtils";
import { getOnboardingState } from "utils/storage";
import OnboardingHelper from "./Helper";

const EndTourHelper = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const params = getQueryParams();
    const showCompletionDialog = async () => {
      const inOnboarding = await getOnboardingState();
      if (params.onboardingComplete && inOnboarding) {
        dispatch({
          type: ReduxActionTypes.SET_HELPER_CONFIG,
          payload: getHelperConfig(OnboardingStep.FINISH),
        });
        setTimeout(() => {
          dispatch({
            type: ReduxActionTypes.SHOW_ONBOARDING_HELPER,
            payload: true,
          });
        }, 1000);
      }
    };

    showCompletionDialog();
  }, []);

  return <OnboardingHelper />;
};

export default EndTourHelper;
