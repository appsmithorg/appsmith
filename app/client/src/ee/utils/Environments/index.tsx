export * from "ce/utils/Environments";

export const ENVIRONMENT_ID_LOCAL_STORAGE_KEY = "currentEnvironmentId";
export const ENVIRONMENT_QUERY_KEY = "environment";
const ENVIRONMENT_LOCAL_STORAGE_KEY = "currentEnvironment";
const USER_PREFERENCE_DISMISS_ENV_CALLOUT = "userPreferenceDismissEnvCallout";
const EDITING_ENVIRONMENT_ID_LOCAL_STORAGE_KEY = "currentEditingEnvironmentId";

export const setUserPreferenceInStorage = () => {
  localStorage.setItem(USER_PREFERENCE_DISMISS_ENV_CALLOUT, "true");
  return "true";
};

export const getUserPreferenceFromStorage = () => {
  return localStorage.getItem(USER_PREFERENCE_DISMISS_ENV_CALLOUT);
};

export const updateLocalStorage = (name: string, id: string) => {
  // Set the values of currentEnv and currentEnvId in localStorage also
  localStorage.setItem(ENVIRONMENT_LOCAL_STORAGE_KEY, name.toLowerCase());
  localStorage.setItem(ENVIRONMENT_ID_LOCAL_STORAGE_KEY, id);
};

export const getCurrentEditingEnvID = () => {
  // Get the values of environment ID being edited
  return (
    localStorage.getItem(EDITING_ENVIRONMENT_ID_LOCAL_STORAGE_KEY) ||
    getCurrentEnvironment()
  );
};

// function to get the current environment from the URL
export const getCurrentEnvName = () => {
  const localStorageEnv = localStorage.getItem(ENVIRONMENT_LOCAL_STORAGE_KEY);
  if (localStorageEnv && localStorageEnv.length > 0) {
    return localStorageEnv;
  }
  return "unused_env";
};

// function to get the current environment from the URL
export const getCurrentEnvironment = () => {
  const localStorageEnv = localStorage.getItem(ENVIRONMENT_LOCAL_STORAGE_KEY);
  //compare currentEnv with local storage and get currentEnvId from localstorage if true

  if (localStorageEnv && localStorageEnv.length > 0) {
    const localStorageEnvId = localStorage.getItem(
      ENVIRONMENT_ID_LOCAL_STORAGE_KEY,
    );
    if (!!localStorageEnvId && localStorageEnvId?.length > 0)
      return localStorageEnvId;
  }
  return "unused_env";
};

export const setCurrentEditingEnvID = (id = "") => {
  // Set the values of environment ID being edited
  localStorage.setItem(EDITING_ENVIRONMENT_ID_LOCAL_STORAGE_KEY, id);
};

export const onUpdateFilterSuccess = (id: string) => {
  setCurrentEditingEnvID(id);
};
