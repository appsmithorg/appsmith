export * from "ce/actions/tenantActions";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

export const validateLicense = (key: string) => ({
  type: ReduxActionTypes.VALIDATE_LICENSE_KEY,
  payload: {
    key,
  },
});

export const setBEBanner = (showBEBanner: boolean) => ({
  type: ReduxActionTypes.SET_SHOW_BILLING_BANNER,
  payload: showBEBanner,
});
