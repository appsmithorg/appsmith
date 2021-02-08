import { useDispatch } from "react-redux";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { setOnboardingState, setOnboardingWelcomeState } from "utils/storage";

export const useIntiateOnboarding = () => {
  const dispatch = useDispatch();

  return async () => {
    await setOnboardingState(true);
    await setOnboardingWelcomeState(true);
    dispatch({
      type: "SHOW_WELCOME_HELPER",
      payload: true,
    });

    AnalyticsUtil.logEvent("ONBOARDING_WELCOME");
  };
};
