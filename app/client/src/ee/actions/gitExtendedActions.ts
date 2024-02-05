import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const generateCdApiKeyAction = () => {
  return { type: ReduxActionTypes.GIT_EX_GENERATE_CD_API_KEY_INIT };
};

export const resetCdApiKeyAction = () => {
  return { type: ReduxActionTypes.GIT_EX_RESET_CD_API_KEY };
};

export const toggleCdConfigAction = () => {
  return {
    type: ReduxActionTypes.GIT_EX_TOGGLE_CD_INIT,
  };
};

export const setShowDisableCDModalAction = (show: boolean) => {
  return {
    type: ReduxActionTypes.GIT_EX_SET_SHOW_DISABLE_CD_MODAL,
    payload: { show },
  };
};

export const setShowReconfigureCdKeyAction = (show: boolean) => {
  return {
    type: ReduxActionTypes.GIT_EX_SET_SHOW_RECONFIGURE_CD_KEY_MODAL,
    payload: { show },
  };
};

export const setLoadCdKeyOnMountAction = (load: boolean) => {
  return {
    type: ReduxActionTypes.GIT_EX_SET_LOAD_CD_KEY_ON_MOUNT,
    payload: { load },
  };
};
