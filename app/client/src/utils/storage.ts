import localforage from "localforage";
import moment from "moment";
import log from "loglevel";

const STORAGE_KEYS: { [id: string]: string } = {
  AUTH_EXPIRATION: "Auth.expiration",
  ROUTE_BEFORE_LOGIN: "RedirectPath",
  COPIED_WIDGET: "CopiedWidget",
  DELETED_WIDGET_PREFIX: "DeletedWidget-",
  ONBOARDING_STATE: "OnboardingState",
  ONBOARDING_WELCOME_STATE: "OnboardingWelcomeState",
  RECENT_ENTITIES: "RecentEntities",
  COMMENTS_INTRO_SEEN: "CommentsIntroSeen",
  ONBOARDING_FORM_IN_PROGRESS: "ONBOARDING_FORM_IN_PROGRESS",
};

const store = localforage.createInstance({
  name: "Appsmith",
});

export const resetAuthExpiration = () => {
  const expireBy = moment()
    .add(1, "h")
    .format();
  store.setItem(STORAGE_KEYS.AUTH_EXPIRATION, expireBy).catch((error) => {
    console.log("Unable to set expiration time", error);
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

export const saveDeletedWidgets = async (widgets: any, widgetId: string) => {
  try {
    await store.setItem(
      `${STORAGE_KEYS.DELETED_WIDGET_PREFIX}${widgetId}`,
      JSON.stringify(widgets),
    );
    return true;
  } catch (error) {
    log.error(
      "An error occurred when temporarily storing delete widget: ",
      error,
    );
    return false;
  }
};

export const getDeletedWidgets = async (widgetId: string) => {
  try {
    const widgets: string | null = await store.getItem(
      `${STORAGE_KEYS.DELETED_WIDGET_PREFIX}${widgetId}`,
    );
    if (widgets && widgets.length > 0) {
      return JSON.parse(widgets);
    }
  } catch (error) {
    log.error("An error occurred when fetching deleted widget: ", error);
  }
};

export const flushDeletedWidgets = async (widgetId: string) => {
  try {
    await store.removeItem(`${STORAGE_KEYS.DELETED_WIDGET_PREFIX}${widgetId}`);
  } catch (error) {
    log.error("An error occurred when flushing deleted widgets: ", error);
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
    console.log(
      "An error occurred when setting onboarding welcome state: ",
      error,
    );
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
    console.log(
      "An error occurred when getting onboarding welcome state: ",
      error,
    );
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
    console.log("An error occurred while saving recent entities", error);
  }
};

export const fetchRecentAppEntities = async (appId: string) => {
  try {
    const recentEntities = (await store.getItem(
      STORAGE_KEYS.RECENT_ENTITIES,
    )) as Record<string, any>;
    return (recentEntities && recentEntities[appId]) || [];
  } catch (error) {
    console.log("An error occurred while fetching recent entities", error);
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
    console.log("An error occurred while saving recent entities", error);
  }
};

export const setCommentsIntroSeen = async (flag: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.COMMENTS_INTRO_SEEN, flag);
    return true;
  } catch (error) {
    console.log("An error occurred when setting COMMENTS_INTRO_SEEN", error);
    return false;
  }
};

export const getCommentsIntroSeen = async () => {
  try {
    const commentsIntroSeen = (await store.getItem(
      STORAGE_KEYS.COMMENTS_INTRO_SEEN,
    )) as boolean;
    return commentsIntroSeen;
  } catch (error) {
    console.log("An error occurred while fetching COMMENTS_INTRO_SEEN", error);
  }
};

export const setOnboardingFormInProgress = async (flag?: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.ONBOARDING_FORM_IN_PROGRESS, flag);
    return true;
  } catch (error) {
    console.log(
      "An error occurred when setting ONBOARDING_FORM_IN_PROGRESS",
      error,
    );
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
    console.log(
      "An error occurred while fetching ONBOARDING_FORM_IN_PROGRESS",
      error,
    );
  }
};
