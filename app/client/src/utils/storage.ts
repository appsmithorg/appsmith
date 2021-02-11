import localforage from "localforage";
import moment from "moment";

const STORAGE_KEYS: { [id: string]: string } = {
  AUTH_EXPIRATION: "Auth.expiration",
  ROUTE_BEFORE_LOGIN: "RedirectPath",
  COPIED_WIDGET: "CopiedWidget",
  DELETED_WIDGET_PREFIX: "DeletedWidget-",
  ONBOARDING_STATE: "OnboardingState",
  ONBOARDING_WELCOME_STATE: "OnboardingWelcomeState",
};

const store = localforage.createInstance({
  name: "Appsmith",
});

export const resetAuthExpiration = () => {
  const expireBy = moment()
    .add(1, "h")
    .format();
  store.setItem(STORAGE_KEYS.AUTH_EXPIRATION, expireBy).catch(() => {
    console.error("Unable to set expiration time");
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
    console.log("An error occurred when storing copied widget: ", error);
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
    console.log("An error occurred when fetching copied widget: ", error);
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
    console.log(
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
    console.log("An error occurred when fetching deleted widget: ", error);
  }
};

export const flushDeletedWidgets = async (widgetId: string) => {
  try {
    await store.removeItem(`${STORAGE_KEYS.DELETED_WIDGET_PREFIX}${widgetId}`);
  } catch (error) {
    console.log("An error occurred when flushing deleted widgets: ", error);
  }
};

export const setOnboardingState = async (onboardingState: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.ONBOARDING_STATE, onboardingState);
    return true;
  } catch (error) {
    console.log("An error occurred when setting onboarding state: ", error);
    return false;
  }
};

export const getOnboardingState = async () => {
  try {
    const onboardingState = await store.getItem(STORAGE_KEYS.ONBOARDING_STATE);
    return onboardingState;
  } catch (error) {
    console.log("An error occurred when getting onboarding state: ", error);
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
