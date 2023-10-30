import log from "loglevel";
import moment from "moment";
import localforage from "localforage";
import type { VersionUpdateState } from "../sagas/WebsocketSagas/versionUpdatePrompt";
import { isNumber } from "lodash";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";

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
  ENABLE_START_SIGNPOSTING: "ENABLE_START_SIGNPOSTING",
  USERS_FIRST_APPLICATION_ID: "USERS_FIRST_APPLICATION_ID",
  FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS:
    "FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS",
  FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY:
    "FIRST_TIME_USER_ONBOARDING_INTRO_MODAL_VISIBILITY",
  HIDE_CONCURRENT_EDITOR_WARNING_TOAST: "HIDE_CONCURRENT_EDITOR_WARNING_TOAST",
  APP_THEMING_BETA_SHOWN: "APP_THEMING_BETA_SHOWN",
  FIRST_TIME_USER_ONBOARDING_TELEMETRY_CALLOUT_VISIBILITY:
    "FIRST_TIME_USER_ONBOARDING_TELEMETRY_CALLOUT_VISIBILITY",
  SIGNPOSTING_APP_STATE: "SIGNPOSTING_APP_STATE",
  AI_SUGGESTED_PROMPTS_SHOWN: "AI_SUGGESTED_PROMPTS_SHOWN",
  AI_TRIGGERED_FOR_PROPERTY_PANE: "AI_TRIGGERED",
  AI_TRIGGERED_FOR_QUERY: "AI_TRIGGERED_FOR_QUERY",
  FEATURE_WALKTHROUGH: "FEATURE_WALKTHROUGH",
  USER_SIGN_UP: "USER_SIGN_UP",
  VERSION_UPDATE_STATE: "VERSION_UPDATE_STATE",
  AI_RECENT_QUERIES: "AI_RECENT_QUERIES",
  CURRENT_ENV: "CURRENT_ENV",
  AI_KNOWLEDGE_BASE: "AI_KNOWLEDGE_BASE",
  PARTNER_PROGRAM_CALLOUT: "PARTNER_PROGRAM_CALLOUT",
};

const store = localforage.createInstance({
  name: "Appsmith",
});

export const resetAuthExpiration = () => {
  const expireBy = moment().add(1, "h").format();
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

const getStoredUsersBetaFlags = async (email: any) => {
  return store.getItem(email);
};

const setStoredUsersBetaFlags = async (email: any, userBetaFlagsObj: any) => {
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
    const copiedWidgetData: string | null = await store.getItem(
      STORAGE_KEYS.COPIED_WIDGET,
    );
    if (copiedWidgetData && copiedWidgetData.length > 0) {
      return JSON.parse(copiedWidgetData);
    }
  } catch (error) {
    log.error("An error occurred when fetching copied widget: ", error);
    return;
  }
  return [];
};

// Function to save the current environment and the appId in indexedDB
export const saveCurrentEnvironment = async (envId: string, appId: string) => {
  try {
    await store.setItem(STORAGE_KEYS.CURRENT_ENV, { envId, appId });
    return true;
  } catch (error) {
    log.error("An error occurred when storing current env: ", error);
    return false;
  }
};

// Function to fetch the current environment and related appId from indexedDB
export const getSavedCurrentEnvironmentDetails = async (): Promise<{
  envId: string;
  appId: string;
}> => {
  try {
    return (
      (await store.getItem(STORAGE_KEYS.CURRENT_ENV)) || {
        envId: "",
        appId: "",
      }
    );
  } catch (error) {
    log.error("An error occurred when fetching current env: ", error);
    return {
      envId: "",
      appId: "",
    };
  }
};

// Function to reset the current environment and related appId from indexedDB
export const resetCurrentEnvironment = async () => {
  try {
    await store.removeItem(STORAGE_KEYS.CURRENT_ENV);
    return true;
  } catch (error) {
    log.error("An error occurred when resetting current env: ", error);
    return false;
  }
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
    return await store.getItem(STORAGE_KEYS.POST_WELCOME_TOUR);
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

export const setEnableStartSignposting = async (flag: boolean) => {
  try {
    await store.setItem(STORAGE_KEYS.ENABLE_START_SIGNPOSTING, flag);
    return true;
  } catch (error) {
    log.error("An error occurred while setting ENABLE_START_SIGNPOSTING");
    log.error(error);
  }
};

export const getEnableStartSignposting = async () => {
  try {
    const enableStartSignposting: string | null = await store.getItem(
      STORAGE_KEYS.ENABLE_START_SIGNPOSTING,
    );
    return enableStartSignposting;
  } catch (error) {
    log.error("An error occurred while fetching ENABLE_START_SIGNPOSTING");
    log.error(error);
  }
};

export const setAIRecentQuery = async (
  applicationId: string,
  query: string,
  type: string,
) => {
  try {
    const recentQueries: {
      [applicationId: string]: {
        [task: string]: string[];
      };
    } | null = (await store.getItem(STORAGE_KEYS.AI_RECENT_QUERIES)) || {};
    const applicationRecentQueries = recentQueries[applicationId] || {};
    let applicationTypeQueries = applicationRecentQueries[type] || [];

    if (!applicationTypeQueries.includes(query)) {
      if (applicationTypeQueries.length >= 3) {
        applicationTypeQueries.pop();
      }
      applicationTypeQueries = [query, ...applicationTypeQueries];
    }

    await store.setItem(STORAGE_KEYS.AI_RECENT_QUERIES, {
      ...recentQueries,
      [applicationId]: {
        ...applicationRecentQueries,
        [type]: applicationTypeQueries,
      },
    });
  } catch (error) {
    log.error("An error occurred while setting AI_RECENT_QUERIES");
    log.error(error);
  }
};

export const getApplicationAIRecentQueriesByType = async (
  applicationId: string,
  type: string,
) => {
  const defaultRecentQueries: string[] = [];

  try {
    const recentQueries: {
      [applicationId: string]: {
        [task: string]: string[];
      };
    } | null = await store.getItem(STORAGE_KEYS.AI_RECENT_QUERIES);
    return (
      recentQueries?.[applicationId]?.[type]?.slice(0, 3) ??
      defaultRecentQueries
    );
  } catch (error) {
    log.error("An error occurred while fetching AI_RECENT_QUERIES");
    log.error(error);
    return defaultRecentQueries;
  }
};

export const setFirstTimeUserOnboardingApplicationId = async (id: string) => {
  try {
    let ids: unknown = await store.getItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
    );

    if (ids) {
      ids = JSON.parse(ids as string);
      if (Array.isArray(ids) && !ids.includes(id)) {
        ids.push(id);
      }
    } else {
      ids = [id];
    }
    await store.setItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
      JSON.stringify(ids),
    );
    return true;
  } catch (error) {
    log.error(
      "An error occurred while setting FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS",
    );
    log.error(error);
  }
};

export const removeFirstTimeUserOnboardingApplicationId = async (
  id: string,
) => {
  try {
    let ids: unknown = await store.getItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
    );

    if (ids) {
      ids = JSON.parse(ids as string);
      if (Array.isArray(ids)) {
        ids = ids.filter((exisitingId) => exisitingId !== id);
        await store.setItem(
          STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
          JSON.stringify(ids),
        );
      }
    }
    return true;
  } catch (error) {
    log.error(
      "An error occurred while setting FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS",
    );
    log.error(error);
  }
};

export const removeAllFirstTimeUserOnboardingApplicationIds = async () => {
  try {
    await store.setItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
      JSON.stringify([]),
    );
    return true;
  } catch (error) {
    log.error(
      "An error occurred while resetting FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS",
    );
    log.error(error);
  }
};

export const getFirstTimeUserOnboardingApplicationIds = async () => {
  try {
    const ids = await store.getItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS,
    );

    if (ids) {
      if (Array.isArray(JSON.parse(ids as string))) {
        return JSON.parse(ids as string);
      }
    }

    return [];
  } catch (error) {
    log.error(
      "An error occurred while fetching FIRST_TIME_USER_ONBOARDING_APPLICATION_IDS",
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
export const getFirstTimeUserOnboardingTelemetryCalloutIsAlreadyShown =
  async () => {
    try {
      const flag = await store.getItem(
        STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_TELEMETRY_CALLOUT_VISIBILITY,
      );
      return flag;
    } catch (error) {
      log.error(
        "An error occurred while fetching FIRST_TIME_USER_ONBOARDING_TELEMETRY_CALLOUT_VISIBILITY",
      );
      log.error(error);
    }
  };

export const setFirstTimeUserOnboardingTelemetryCalloutVisibility = async (
  flag: boolean,
) => {
  try {
    await store.setItem(
      STORAGE_KEYS.FIRST_TIME_USER_ONBOARDING_TELEMETRY_CALLOUT_VISIBILITY,
      flag,
    );
    return true;
  } catch (error) {
    log.error(
      "An error occurred while fetching FIRST_TIME_USER_ONBOARDING_TELEMETRY_CALLOUT_VISIBILITY",
    );
    log.error(error);
  }
};

export const setAIPromptTriggered = async (mode: string) => {
  try {
    let noOfTimesAITriggered: number = await getAIPromptTriggered(mode);

    if (noOfTimesAITriggered >= 5) {
      return noOfTimesAITriggered;
    }

    const storageKey =
      mode === EditorModes.TEXT_WITH_BINDING
        ? STORAGE_KEYS.AI_TRIGGERED_FOR_PROPERTY_PANE
        : STORAGE_KEYS.AI_TRIGGERED_FOR_QUERY;

    noOfTimesAITriggered += 1;
    await store.setItem(storageKey, noOfTimesAITriggered);

    return noOfTimesAITriggered;
  } catch (error) {
    log.error("An error occurred while setting AI_TRIGGERED");
    log.error(error);

    return 0;
  }
};

export const getAIPromptTriggered = async (mode: string) => {
  try {
    const storageKey =
      mode === EditorModes.TEXT_WITH_BINDING
        ? STORAGE_KEYS.AI_TRIGGERED_FOR_PROPERTY_PANE
        : STORAGE_KEYS.AI_TRIGGERED_FOR_QUERY;

    const flag: number | null = await store.getItem(storageKey);

    if (flag === null) return 0;

    return flag;
  } catch (error) {
    log.error("An error occurred while fetching AI_TRIGGERED");
    log.error(error);
    return 0;
  }
};
export const setFeatureWalkthroughShown = async (key: string, value: any) => {
  try {
    let flagsJSON: Record<string, any> | null = await store.getItem(
      STORAGE_KEYS.FEATURE_WALKTHROUGH,
    );

    if (typeof flagsJSON === "object" && flagsJSON) {
      flagsJSON[key] = value;
    } else {
      flagsJSON = { [key]: value };
    }

    await store.setItem(STORAGE_KEYS.FEATURE_WALKTHROUGH, flagsJSON);
    return true;
  } catch (error) {
    log.error("An error occurred while updating FEATURE_WALKTHROUGH");
    log.error(error);
  }
};

export const getFeatureWalkthroughShown = async (key: string) => {
  try {
    const flagsJSON: Record<string, any> | null = await store.getItem(
      STORAGE_KEYS.FEATURE_WALKTHROUGH,
    );

    if (typeof flagsJSON === "object" && flagsJSON) {
      return !!flagsJSON[key];
    }

    return false;
  } catch (error) {
    log.error("An error occurred while reading FEATURE_WALKTHROUGH");
    log.error(error);
  }
};

export const setUserSignedUpFlag = async (email: string) => {
  try {
    let userSignedUp: Record<string, any> | null = await store.getItem(
      STORAGE_KEYS.USER_SIGN_UP,
    );

    if (typeof userSignedUp === "object" && userSignedUp) {
      userSignedUp[email] = Date.now();
    } else {
      userSignedUp = { [email]: Date.now() };
    }

    await store.setItem(STORAGE_KEYS.USER_SIGN_UP, userSignedUp);
    return true;
  } catch (error) {
    log.error("An error occurred while updating USER_SIGN_UP");
    log.error(error);
  }
};

export const isUserSignedUpFlagSet = async (email: string) => {
  try {
    const userSignedUp: Record<string, any> | null = await store.getItem(
      STORAGE_KEYS.USER_SIGN_UP,
    );

    if (typeof userSignedUp === "object" && userSignedUp) {
      return !!userSignedUp[email];
    }

    return false;
  } catch (error) {
    log.error("An error occurred while reading USER_SIGN_UP");
    log.error(error);
    return false;
  }
};

export const setVersionUpdateState = async (state: VersionUpdateState) => {
  try {
    await store.setItem(STORAGE_KEYS.VERSION_UPDATE_STATE, state);
  } catch (e) {
    log.error("An error occurred while storing version update state", e);
  }
};

export const getVersionUpdateState =
  async (): Promise<VersionUpdateState | null> => {
    return await store.getItem<VersionUpdateState | null>(
      STORAGE_KEYS.VERSION_UPDATE_STATE,
    );
  };

export const removeVersionUpdateState = async () => {
  return store.removeItem(STORAGE_KEYS.VERSION_UPDATE_STATE);
};

export const getAppKbState = async (appId: string) => {
  try {
    const aiKBApplicationMap: Record<
      string,
      {
        checksum: string;
        pageSlugs: {
          [pageId: string]: {
            hasReacted: boolean;
          };
        };
      }
    > | null = await store.getItem(STORAGE_KEYS.AI_KNOWLEDGE_BASE);

    if (typeof aiKBApplicationMap === "object" && aiKBApplicationMap) {
      return aiKBApplicationMap[appId];
    }

    return null;
  } catch (error) {
    log.error("An error occurred while reading AI_KNOWLEDGE_BASE");
    log.error(error);

    return null;
  }
};

export const initAppKbState = async (
  appId: string,
  checksum: string,
  pageSlugs: string[],
) => {
  try {
    let aiKBApplicationMap: Record<
      string,
      {
        checksum: string;
        pageSlugs: {
          [pageId: string]: {
            hasReacted: boolean;
          };
        };
      }
    > | null = await store.getItem(STORAGE_KEYS.AI_KNOWLEDGE_BASE);

    if (typeof aiKBApplicationMap !== "object" || !aiKBApplicationMap) {
      aiKBApplicationMap = {};
    }

    const appKbState = {
      checksum,
      pageSlugs: pageSlugs.reduce(
        (acc, pageSlug) => {
          acc[pageSlug] = {
            hasReacted: false,
          };
          return acc;
        },
        {} as Record<string, { hasReacted: boolean }>,
      ) as Record<string, { hasReacted: boolean }>,
    };

    aiKBApplicationMap[appId] = appKbState;

    await store.setItem(STORAGE_KEYS.AI_KNOWLEDGE_BASE, aiKBApplicationMap);
    return appKbState;
  } catch (error) {
    log.error("An error occurred while updating AI_KNOWLEDGE_BASE");
    log.error(error);
  }
};

export const reactToPageKB = async (
  appId: string,
  pageId: string,
  hasReacted: boolean,
) => {
  try {
    let aiKBApplicationMap: Record<
      string,
      {
        checksum: string;
        pageSlugs: {
          [pageId: string]: {
            hasReacted: boolean;
          };
        };
      }
    > | null = await store.getItem(STORAGE_KEYS.AI_KNOWLEDGE_BASE);

    if (typeof aiKBApplicationMap !== "object" || !aiKBApplicationMap) {
      aiKBApplicationMap = {};
    }

    if (aiKBApplicationMap?.[appId]?.pageSlugs?.[pageId]) {
      aiKBApplicationMap[appId].pageSlugs[pageId].hasReacted = hasReacted;
    }

    await store.setItem(STORAGE_KEYS.AI_KNOWLEDGE_BASE, aiKBApplicationMap);
    return true;
  } catch (error) {
    log.error("An error occurred while updating AI_KNOWLEDGE_BASE");
    log.error(error);
  }
};

export const setAISuggestedPromptShownForType = async (type: string) => {
  try {
    const suggestedPromptsShownForType: Record<string, number> =
      (await store.getItem(STORAGE_KEYS.AI_SUGGESTED_PROMPTS_SHOWN)) || {};

    if (isNumber(suggestedPromptsShownForType[type])) {
      suggestedPromptsShownForType[type] += 1;
    } else {
      suggestedPromptsShownForType[type] = 1;
    }

    if (suggestedPromptsShownForType[type] > 5) {
      return suggestedPromptsShownForType[type];
    }

    await store.setItem(
      STORAGE_KEYS.AI_SUGGESTED_PROMPTS_SHOWN,
      suggestedPromptsShownForType,
    );

    return suggestedPromptsShownForType[type];
  } catch (error) {
    log.error("An error occurred while setting AI_SUGGESTED_PROMPTS_SHOWN");
    log.error(error);

    return 0;
  }
};

export const getAISuggestedPromptShownForType = async (type: string) => {
  try {
    const suggestedPromptsShownForType: Record<string, number> | null =
      await store.getItem(STORAGE_KEYS.AI_SUGGESTED_PROMPTS_SHOWN);

    if (suggestedPromptsShownForType === null) return 0;

    return suggestedPromptsShownForType[type] || 0;
  } catch (error) {
    log.error("An error occurred while fetching AI_SUGGESTED_PROMPTS_SHOWN");
    log.error(error);
    return 0;
  }
};

export const setPartnerProgramCalloutShown = async () => {
  try {
    await store.setItem(STORAGE_KEYS.PARTNER_PROGRAM_CALLOUT, true);
    return true;
  } catch (error) {
    log.error("An error occurred while setting PARTNER_PROGRAM_CALLOUT");
    log.error(error);
  }
};

export const getPartnerProgramCalloutShown = async () => {
  try {
    const flag = await store.getItem(STORAGE_KEYS.PARTNER_PROGRAM_CALLOUT);
    return flag;
  } catch (error) {
    log.error("An error occurred while fetching PARTNER_PROGRAM_CALLOUT");
    log.error(error);
  }
};

export const setUsersFirstApplicationId = async (appId: string) => {
  try {
    await store.setItem(STORAGE_KEYS.USERS_FIRST_APPLICATION_ID, appId);
    return true;
  } catch (error) {
    log.error("An error occurred while setting USERS_FIRST_APPLICATION_ID");
    log.error(error);
  }
};

export const getUsersFirstApplicationId = async () => {
  try {
    const firstApplicationId: string | null = await store.getItem(
      STORAGE_KEYS.USERS_FIRST_APPLICATION_ID,
    );
    return firstApplicationId;
  } catch (error) {
    log.error("An error occurred while fetching USERS_FIRST_APPLICATION_ID");
    log.error(error);
  }
};
