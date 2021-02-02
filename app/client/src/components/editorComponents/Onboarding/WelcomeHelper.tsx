import { OnboardingStep } from "constants/OnboardingConstants";
import { ReduxActionTypes } from "constants/ReduxActionConstants";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getHelperConfig } from "sagas/OnboardingSagas";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "store";
import { getOnboardingWelcomeState } from "utils/storage";
import OnboardingHelper from "./Helper";

const WelcomeHelper = () => {
  const [showHelper, setShowHelper] = useState(false);
  const currentUser = useSelector(getCurrentUser);
  const showWelcomeHelper = useSelector(
    (state) => state.ui.onBoarding.showWelcomeHelper,
  );
  const helperConfig = getHelperConfig(OnboardingStep.WELCOME);
  const dispatch = useDispatch();

  useEffect(() => {
    const isInOnboarding = async () => {
      const inOnboarding = await getOnboardingWelcomeState();

      if (inOnboarding && currentUser) {
        dispatch({
          type: ReduxActionTypes.SHOW_ONBOARDING_HELPER,
          payload: true,
        });

        setShowHelper(true);
      }
    };

    dispatch({
      type: ReduxActionTypes.SET_HELPER_CONFIG,
      payload: helperConfig,
    });
    isInOnboarding();
  }, [currentUser, showWelcomeHelper]);

  if (!showHelper) return null;

  return <OnboardingHelper />;
};

export default WelcomeHelper;
