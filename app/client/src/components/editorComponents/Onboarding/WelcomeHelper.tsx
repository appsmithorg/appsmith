import {
  setHelperConfig,
  showOnboardingHelper,
} from "actions/onboardingActions";
import {
  OnboardingHelperConfig,
  OnboardingStep,
} from "constants/OnboardingConstants";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getHelperConfig } from "sagas/OnboardingSagas";
import { getCurrentUser } from "selectors/usersSelectors";
import { useSelector } from "store";
import { getOnboardingWelcomeState } from "utils/storage";
import OnboardingHelper from "./Helper";

function WelcomeHelper() {
  const [showHelper, setShowHelper] = useState(false);
  const currentUser = useSelector(getCurrentUser);
  const showWelcomeHelper = useSelector(
    (state) => state.ui.onBoarding.showWelcomeHelper,
  );
  const helperConfig = getHelperConfig(
    OnboardingStep.WELCOME,
  ) as OnboardingHelperConfig;
  const dispatch = useDispatch();

  useEffect(() => {
    const isInOnboarding = async () => {
      const inOnboarding = await getOnboardingWelcomeState();

      if (inOnboarding && currentUser) {
        dispatch(dispatch(showOnboardingHelper(true)));

        setShowHelper(true);
      }
    };

    dispatch(setHelperConfig(helperConfig));
    isInOnboarding();
  }, [currentUser, showWelcomeHelper]);

  if (!showHelper) return null;

  return <OnboardingHelper />;
}

export default WelcomeHelper;
