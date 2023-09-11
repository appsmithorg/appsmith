export * from "ce/utils/Environments";

export const ENVIRONMENT_QUERY_KEY = "environment";
const USER_PREFERENCE_DISMISS_ENV_CALLOUT = "userPreferenceDismissEnvCallout";

export const setUserPreferenceInStorage = () => {
  localStorage.setItem(USER_PREFERENCE_DISMISS_ENV_CALLOUT, "true");
  return "true";
};

export const getUserPreferenceFromStorage = () => {
  return localStorage.getItem(USER_PREFERENCE_DISMISS_ENV_CALLOUT);
};
