import {
  setHelperConfig,
  showOnboardingHelper,
} from "actions/onboardingActions";
import {
  OnboardingHelperConfig,
  OnboardingStep,
} from "constants/OnboardingConstants";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getHelperConfig } from "sagas/OnboardingSagas";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getQueryParams } from "utils/AppsmithUtils";
import { playOnboardingAnimation } from "utils/helpers";
import { getOnboardingState } from "utils/storage";
import OnboardingHelper from "./Helper";

const EndTourHelper = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const params = getQueryParams();
    const showCompletionDialog = async () => {
      const inOnboarding = await getOnboardingState();
      if (params.onboardingComplete && inOnboarding) {
        dispatch(
          setHelperConfig(
            getHelperConfig(OnboardingStep.FINISH) as OnboardingHelperConfig,
          ),
        );
        AnalyticsUtil.logEvent("ONBOARDING_COMPLETE");
        dispatch({
          type: "SET_CURRENT_SUBSTEP",
          payload: 5,
        });
        setTimeout(() => {
          playOnboardingAnimation();
          dispatch(showOnboardingHelper(true));
        }, 1000);
      }
    };

    showCompletionDialog();
  }, []);

  return <OnboardingHelper />;
};

export default EndTourHelper;
