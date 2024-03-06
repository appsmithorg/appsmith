export * from "ce/actions/tenantActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const validateLicense = (key: string, isUserOnboarding: boolean) => ({
  type: ReduxActionTypes.VALIDATE_LICENSE_KEY,
  payload: {
    key,
    isUserOnboarding,
  },
});

export const showLicenseModal = (showLicenseModal: boolean) => ({
  type: ReduxActionTypes.SHOW_LICENSE_MODAL,
  payload: showLicenseModal,
});

export const forceLicenseCheck = () => ({
  type: ReduxActionTypes.FORCE_LICENSE_CHECK_INIT,
});

export const showRemoveLicenseModal = (showRemoveLicenseModal: boolean) => ({
  type: ReduxActionTypes.SHOW_REMOVE_LICENSE_MODAL,
  payload: showRemoveLicenseModal,
});

export const removeLicense = () => ({
  type: ReduxActionTypes.REMOVE_LICENSE_INIT,
});

export const validateLicenseDryRun = (key: string) => {
  return {
    type: ReduxActionTypes.VALIDATE_LICENSE_KEY_DRY_RUN_INIT,
    payload: {
      key,
    },
  };
};

export const showDowngradeLicenseModal = (showModal: boolean) => ({
  type: ReduxActionTypes.SHOW_DOWNGRADE_LICENSE_MODAL,
  payload: showModal,
});
