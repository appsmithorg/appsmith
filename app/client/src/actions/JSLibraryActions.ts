import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { TJSLibrary } from "workers/common/JSLibrary";

export function fetchJSLibraries(applicationId: string) {
  return {
    type: ReduxActionTypes.FETCH_JS_LIBRARIES_INIT,
    payload: applicationId,
  };
}

export function installLibraryInit(payload: Partial<TJSLibrary>) {
  return {
    type: ReduxActionTypes.INSTALL_LIBRARY_INIT,
    payload,
  };
}

export function toggleInstaller(payload: boolean) {
  return {
    type: ReduxActionTypes.TOGGLE_INSTALLER,
    payload,
  };
}

export function uninstallLibraryInit(payload: TJSLibrary) {
  return {
    type: ReduxActionTypes.UNINSTALL_LIBRARY_INIT,
    payload,
  };
}

export function clearInstalls() {
  return {
    type: ReduxActionTypes.CLEAR_PROCESSED_INSTALLS,
  };
}
