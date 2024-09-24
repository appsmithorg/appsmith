import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ApiResponse } from "api/ApiResponses";
import type { JSLibrary } from "workers/common/JSLibrary";

export function fetchJSLibraries(
  applicationId: string,
  customJSLibraries?: ApiResponse,
) {
  return {
    type: ReduxActionTypes.FETCH_JS_LIBRARIES_INIT,
    payload: { applicationId, customJSLibraries },
  };
}

export function installLibraryInit(payload: Partial<JSLibrary>) {
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

export function uninstallLibraryInit(payload: JSLibrary) {
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
