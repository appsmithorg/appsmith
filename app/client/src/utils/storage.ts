import log from "loglevel";
import moment from "moment";
import localforage from "localforage";

export const STORAGE_KEYS: {
  [id: string]: string;
} = {
  AUTH_EXPIRATION: "Auth.expiration",
  ROUTE_BEFORE_LOGIN: "RedirectPath",
  COPIED_WIDGET: "CopiedWidget",
  GROUP_COPIED_WIDGETS: "groupCopiedWidgets",
  POST_WELCOME_TOUR: "PostWelcomeTour",
  RECENT_ENTITIES: "RecentEntities",
  TEMPLATES_NOTIFICATION_SEEN: "TEMPLATES_NOTIFICATION_SEEN",
  ONBOARDING_FORM_IN_PROGRESS: "ONBOARDING_FORM_IN_PROGRESS",
  ENABLE_FIRST_TIME_USER_ONBOARDING: "ENABLE_FIRST_TIME_USER_ONBOARDING",
  FIRST_TIME_USER_ONBOARDING_APPLICATION_ID:
    "FIRST_TIME_USER_ONBOARDING_APPLICATION_ID",
  FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY:
    "FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY",
  HIDE_CONCURRENT_EDITOR_WARNING_TOAST: "HIDE_CONCURRENT_EDITOR_WARNING_TOAST",
  APP_THEMING_BETA_SHOWN: "APP_THEMING_BETA_SHOWN",
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

const getStoredUsersBetaFlags = (email: any) => {
  return store.getItem(email);
};

const setStoredUsersBetaFlags = (email: any, userBetaFlagsObj: any) => {
  return store.setItem(email, userBetaFlagsObj);
};

export const setBetaFlag = async (email: any, key: string, value: any) => {
  const userBetaFlagsObj: any = await getStoredUsersBetaFlags(email);
  const updatedObj = {
    ...userBetaFlagsObj,
    [key]: value,
  };
  setStoredUsersBetaFlags(email, updatedObj);
};

export const getBetaFlag = async (email: any, key: string) => {
  const userBetaFlagsObj: any = await getStoredUsersBetaFlags(email);

  return userBetaFlagsObj && userBetaFlagsObj[key];
};

export const getReflowOnBoardingFlag = async (email: any) => {
  const userBetaFlagsObj: any = await getStoredUsersBetaFlags(email);
  return (
    userBetaFlagsObj && userBetaFlagsObj[STORAGE_KEYS.REFLOW_ONBOARDED_FLAG]
  );
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
  return [];
};

export const setPostWelcomeTourState = async (flag: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.POST_WELCOME_TOUR, flag);
    return true;
  } catch (error) {
    log.error("An error occurred when setting post welcome tour state", error);
    return false;
  }
};

export const getPostWelcomeTourState = async () => {
  try {
    const onboardingState = await store.getItem(STORAGE_KEYS.POST_WELCOME_TOUR);
    return onboardingState;
  } catch (error) {
    log.error("An error occurred when getting post welcome tour state", error);
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

export const fetchRecentAppEntities = async (recentEntitiesKey: string) => {
  try {
    const recentEntities = (await store.getItem(
      STORAGE_KEYS.RECENT_ENTITIES,
    )) as Record<string, any>;
    return (recentEntities && recentEntities[recentEntitiesKey]) || [];
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
      // todo (rishabh s) purge recent entities across branches
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
    const enableFirstTimeUserOnboarding: string | null = await store.getItem(
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
    const flag: string | null = await store.getItem(
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

export const getTemplateNotificationSeen = async () => {
  try {
    const seenTemplateNotifications = await store.getItem(
      STORAGE_KEYS.TEMPLATES_NOTIFICATION_SEEN,
    );
    return seenTemplateNotifications;
  } catch (error) {
    log.error(
      "An error occurred while getting TEMPLATES_NOTIFICATION_SEEN flag: ",
      error,
    );
    return false;
  }
};

export const setTemplateNotificationSeen = async (flag: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.TEMPLATES_NOTIFICATION_SEEN, flag);
    return true;
  } catch (error) {
    log.error(
      "An error occurred while setting TEMPLATES_NOTIFICATION_SEEN flag: ",
      error,
    );
    return false;
  }
};
