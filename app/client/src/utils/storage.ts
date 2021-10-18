import log from "loglevel";
import moment from "moment";
import localforage from "localforage";

const STORAGE_KEYS: { [id: string]: string } = {
  AUTH_EXPIRATION: "Auth.expiration",
  ROUTE_BEFORE_LOGIN: "RedirectPath",
  COPIED_WIDGET: "CopiedWidget",
  GROUP_COPIED_WIDGETS: "groupCopiedWidgets",
  ONBOARDING_STATE: "OnboardingState",
  ONBOARDING_WELCOME_STATE: "OnboardingWelcomeState",
  RECENT_ENTITIES: "RecentEntities",
  COMMENTS_INTRO_SEEN: "CommentsIntroSeen",
  ONBOARDING_FORM_IN_PROGRESS: "ONBOARDING_FORM_IN_PROGRESS",
  ENABLE_FIRST_TIME_USER_ONBOARDING: "ENABLE_FIRST_TIME_USER_ONBOARDING",
  FIRST_TIME_USER_ONBOARDING_APPLICATION_ID:
    "FIRST_TIME_USER_ONBOARDING_APPLICATION_ID",
  FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY:
    "FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY",
  HIDE_CONCURRENT_EDITOR_WARNING_TOAST: "HIDE_CONCURRENT_EDITOR_WARNING_TOAST",
};

const store = localforage.createInstance({
  name: "Appsmith",
});

export const resetAuthExpiration = () => {
  const expireBy = moment()
    .add(1, "h")
    .format();
  store.setItem(STORAGE_KEYS.AUTH_EXPIRATION, expireBy).catch((error) => {
    log.error("Unable to set expiration time");
    log.error(error);
  });
};

export const hasAuthExpired = async () => {
  const expireBy: string | null = await store.getItem(
    STORAGE_KEYS.AUTH_EXPIRATION,
  );
  if (expireBy && moment().isAfter(moment(expireBy))) {
    return true;
  }
  return false;
};

export const saveCopiedWidgets = async (widgetJSON: string) => {
  try {
    await store.setItem(STORAGE_KEYS.COPIED_WIDGET, widgetJSON);
    return true;
  } catch (error) {
    log.error("An error occurred when storing copied widget: ", error);
    return false;
  }
};

export const getCopiedWidgets = async () => {
  try {
    const widget: string | null = await store.getItem(
      STORAGE_KEYS.COPIED_WIDGET,
    );
    if (widget && widget.length > 0) {
      return JSON.parse(widget);
    }
  } catch (error) {
    log.error("An error occurred when fetching copied widget: ", error);
    return;
  }
};

export const setOnboardingState = async (onboardingState: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.ONBOARDING_STATE, onboardingState);
    return true;
  } catch (error) {
    log.error("An error occurred when setting onboarding state: ", error);
    return false;
  }
};

export const getOnboardingState = async () => {
  try {
    const onboardingState = await store.getItem(STORAGE_KEYS.ONBOARDING_STATE);
    return onboardingState;
  } catch (error) {
    log.error("An error occurred when getting onboarding state: ", error);
  }
};

export const setOnboardingWelcomeState = async (onboardingState: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.ONBOARDING_WELCOME_STATE, onboardingState);
    return true;
  } catch (error) {
    log.error("An error occurred when setting onboarding welcome state: ");
    log.error(error);
    return false;
  }
};

export const getOnboardingWelcomeState = async () => {
  try {
    const onboardingState = await store.getItem(
      STORAGE_KEYS.ONBOARDING_WELCOME_STATE,
    );
    return onboardingState;
  } catch (error) {
    log.error("An error occurred when getting onboarding welcome state: ");
    log.error(error);
  }
};

export const setRecentAppEntities = async (entities: any, appId: string) => {
  try {
    const recentEntities =
      ((await store.getItem(STORAGE_KEYS.RECENT_ENTITIES)) as Record<
        string,
        any
      >) || {};
    recentEntities[appId] = entities;
    await store.setItem(STORAGE_KEYS.RECENT_ENTITIES, recentEntities);
  } catch (error) {
    log.error("An error occurred while saving recent entities");
    log.error(error);
  }
};

export const fetchRecentAppEntities = async (appId: string) => {
  try {
    const recentEntities = (await store.getItem(
      STORAGE_KEYS.RECENT_ENTITIES,
    )) as Record<string, any>;
    return (recentEntities && recentEntities[appId]) || [];
  } catch (error) {
    log.error("An error occurred while fetching recent entities");
    log.error(error);
  }
};

export const deleteRecentAppEntities = async (appId: string) => {
  try {
    const recentEntities =
      ((await store.getItem(STORAGE_KEYS.RECENT_ENTITIES)) as Record<
        string,
        any
      >) || {};
    if (typeof recentEntities === "object") {
      delete recentEntities[appId];
    }
    await store.setItem(STORAGE_KEYS.RECENT_ENTITIES, recentEntities);
  } catch (error) {
    log.error("An error occurred while saving recent entities");
    log.error(error);
  }
};

export const setOnboardingFormInProgress = async (flag?: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.ONBOARDING_FORM_IN_PROGRESS, flag);
    return true;
  } catch (error) {
    log.error("An error occurred when setting ONBOARDING_FORM_IN_PROGRESS");
    log.error(error);
    return false;
  }
};

export const getOnboardingFormInProgress = async () => {
  try {
    const onboardingFormInProgress = await store.getItem(
      STORAGE_KEYS.ONBOARDING_FORM_IN_PROGRESS,
    );
    return onboardingFormInProgress;
  } catch (error) {
    log.error("An error occurred while fetching ONBOARDING_FORM_IN_PROGRESS");
    log.error(error);
  }
};

export const setEnableFirstTimeUserOnboarding = async (flag: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.ENABLE_FIRST_TIME_USER_ONBOARDING, flag);
    return true;
  } catch (error) {
    log.error(
      "An error occurred while setting ENABLE_FIRST_TIME_USER_ONBOARDING",
    );
    log.error(error);
  }
};

export const getEnableFirstTimeUserOnboarding = async () => {
  try {
    const enableFirstTimeUserOnboarding: any = await store.getItem(
      STORAGE_KEYS.ENABLE_FIRST_TIME_USER_ONBOARDING,
    );
    return enableFirstTimeUserOnboarding;
  } catch (error) {
    log.error(
      "An error occurred while fetching ENABLE_FIRST_TIME_USER_ONBOARDING",
    );
    log.error(error);
  }
};

export const setFirstTimeUserOnboardingApplicationId = async (id: string) => {
  try {
    await store.setItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
      id,
    );
    return true;
  } catch (error) {
    log.error(
      "An error occurred while setting FIRST_TIME_USER_ONBOARDING_APPLICATION_ID",
    );
    log.error(error);
  }
};

export const getFirstTimeUserOnboardingApplicationId = async () => {
  try {
    const id = await store.getItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
    );
    return id;
  } catch (error) {
    log.error(
      "An error occurred while fetching FIRST_TIME_USER_ONBOARDING_APPLICATION_ID",
    );
    log.error(error);
  }
};

export const setFirstTimeUserOnboardingIntroModalVisibility = async (
  flag: boolean,
) => {
  try {
    await store.setItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY,
      flag,
    );
    return true;
  } catch (error) {
    log.error(
      "An error occurred while setting FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY",
    );
    log.error(error);
  }
};

export const getFirstTimeUserOnboardingIntroModalVisibility = async () => {
  try {
    const flag = await store.getItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY,
    );
    return flag;
  } catch (error) {
    log.error(
      "An error occurred while fetching FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY",
    );
    log.error(error);
  }
};

export const hideConcurrentEditorWarningToast = async () => {
  try {
    await store.setItem(
      STORAGE_KEYS.HIDE_CONCURRENT_EDITOR_WARNING_TOAST,
      true,
    );
    return true;
  } catch (error) {
    log.error(
      "An error occurred while setting HIDE_CONCURRENT_EDITOR_WARNING_TOAST",
    );
    log.error(error);
  }
};

export const getIsConcurrentEditorWarningToastHidden = async () => {
  try {
    const flag = await store.getItem(
      STORAGE_KEYS.HIDE_CONCURRENT_EDITOR_WARNING_TOAST,
    );
    return flag;
  } catch (error) {
    log.error(
      "An error occurred while fetching HIDE_CONCURRENT_EDITOR_WARNING_TOAST",
    );
    log.error(error);
  }
};
