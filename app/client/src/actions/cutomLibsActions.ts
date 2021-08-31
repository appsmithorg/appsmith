import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { ExtraLibrary } from "utils/ExtraLibrary";

export enum LIB_ACTION {
  DOWNLOAD_SCRIPT = "DOWNLOAD_SCRIPT",
}

export const initializeInstallation = (payload: any) => ({
  type: ReduxActionTypes.LIB_INSTALL_INIT,
  payload,
});

export const installationSuccessful = (payload: ExtraLibrary) => ({
  type: ReduxActionTypes.LIB_INSTALL_SUCCESS,
  payload,
});

export const installationFailed = (payload: ExtraLibrary) => ({
  type: ReduxActionErrorTypes.LIB_INSTALL_ERROR,
  payload,
});

export const initializeUnInstallation = (payload: any) => ({
  type: ReduxActionTypes.LIB_UNINSTALL_INIT,
  payload,
});

export const initializeUpdate = (payload: any) => ({
  type: ReduxActionTypes.LIB_UPDATE_INIT,
  payload,
});
