import type { ReduxAction } from "@appsmith/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { createImmerReducer } from "utils/ReducerUtils";

export interface GitExtendedState {
  generateCdApiKeyLoading: boolean;
  cdApiKey: string | null;
  toggleCdLoading: boolean;
  showDisableCDModal: boolean;
  loadCdKeyOnMount: boolean;
  showReconfigureCdKeyModal: boolean;
}

const initialState: GitExtendedState = {
  generateCdApiKeyLoading: false,
  cdApiKey: null,
  toggleCdLoading: false,
  showDisableCDModal: false,
  loadCdKeyOnMount: false,
  showReconfigureCdKeyModal: false,
};

const handlers = {
  // generate CD api key
  [ReduxActionTypes.GIT_EX_GENERATE_CD_API_KEY_INIT]: (
    draftState: GitExtendedState,
  ) => {
    draftState.generateCdApiKeyLoading = true;
    return draftState;
  },
  [ReduxActionTypes.GIT_EX_GENERATE_CD_API_KEY_SUCCESS]: (
    draftState: GitExtendedState,
    action: ReduxAction<{ cdApiKey: string }>,
  ) => {
    draftState.generateCdApiKeyLoading = false;
    draftState.cdApiKey = action.payload.cdApiKey;
    return draftState;
  },
  [ReduxActionErrorTypes.GIT_EX_GENERATE_CD_API_KEY_ERROR]: (
    draftState: GitExtendedState,
  ) => {
    draftState.generateCdApiKeyLoading = false;
    return draftState;
  },

  // reset CD api key
  [ReduxActionTypes.GIT_EX_RESET_CD_API_KEY]: (
    draftState: GitExtendedState,
  ) => {
    draftState.cdApiKey = null;
    return draftState;
  },

  // update CD config
  [ReduxActionTypes.GIT_EX_TOGGLE_CD_INIT]: (draftState: GitExtendedState) => {
    draftState.toggleCdLoading = true;
    return draftState;
  },
  [ReduxActionTypes.GIT_EX_TOGGLE_CD_SUCCESS]: (
    draftState: GitExtendedState,
  ) => {
    draftState.toggleCdLoading = false;
    return draftState;
  },
  [ReduxActionErrorTypes.GIT_EX_TOGGLE_CD_ERROR]: (
    draftState: GitExtendedState,
  ) => {
    draftState.toggleCdLoading = false;
    return draftState;
  },

  // disable CD modal
  [ReduxActionTypes.GIT_EX_SET_SHOW_DISABLE_CD_MODAL]: (
    draftState: GitExtendedState,
    action: ReduxAction<{ show: boolean }>,
  ) => {
    draftState.showDisableCDModal = action.payload.show;
    return draftState;
  },

  // reconfifure CD key modal
  [ReduxActionTypes.GIT_EX_SET_SHOW_RECONFIGURE_CD_KEY_MODAL]: (
    draftState: GitExtendedState,
    action: ReduxAction<{ show: boolean }>,
  ) => {
    draftState.showReconfigureCdKeyModal = action.payload.show;
    return draftState;
  },
  [ReduxActionTypes.GIT_EX_SET_LOAD_CD_KEY_ON_MOUNT]: (
    draftstate: GitExtendedState,
    action: ReduxAction<{ load: boolean }>,
  ) => {
    draftstate.loadCdKeyOnMount = action.payload.load;
    return draftstate;
  },
};

const gitExtendedReducer = createImmerReducer(initialState, handlers);

export default gitExtendedReducer;
