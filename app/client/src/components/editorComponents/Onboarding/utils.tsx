import { setOnboardingState, setOnboardingWelcomeState } from "utils/storage";

export const useIntiateOnboarding = () => {
  return async () => {
    await setOnboardingState(true);
    await setOnboardingWelcomeState(true);
  };
};
