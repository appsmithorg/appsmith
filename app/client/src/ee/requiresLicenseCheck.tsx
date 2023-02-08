import React from "react";
import { useSelector } from "react-redux";
import { Redirect, useLocation } from "react-router";
import {
  isValidLicense,
  isTenantLoading,
} from "@appsmith/selectors/tenantSelectors";
import { selectFeatureFlags } from "selectors/usersSelectors";
import {
  USER_AUTH_URL,
  USERS_URL,
  SETUP,
  BASE_LOGIN_URL,
  BASE_SIGNUP_URL,
  SIGNUP_SUCCESS_URL,
  AUTH_LOGIN_URL,
  FORGOT_PASSWORD_URL,
  RESET_PASSWORD_URL,
  SIGN_UP_URL,
  LICENSE_CHECK_PATH,
  PAGE_NOT_FOUND_URL,
  APPLICATIONS_URL,
} from "constants/routes";

const NO_LICENSE_WHITE_LIST = [
  USER_AUTH_URL,
  USERS_URL,
  SETUP,
  BASE_LOGIN_URL,
  BASE_SIGNUP_URL,
  SIGNUP_SUCCESS_URL,
  AUTH_LOGIN_URL,
  FORGOT_PASSWORD_URL,
  RESET_PASSWORD_URL,
  SIGN_UP_URL,
  PAGE_NOT_FOUND_URL,
];

export const requiresLicenseCheck = (Component: React.ComponentType) => {
  return function Wrapped(props: any) {
    const location = useLocation();
    const isLicenseValid = useSelector(isValidLicense);
    const isLoading = useSelector(isTenantLoading);
    const features = useSelector(selectFeatureFlags);
    const isBillingEnabled = features?.USAGE_AND_BILLING;

    const shouldRedirect =
      isBillingEnabled &&
      !isLoading &&
      !isLicenseValid &&
      !NO_LICENSE_WHITE_LIST.includes(location.pathname);

    if (shouldRedirect) {
      return <Redirect to={LICENSE_CHECK_PATH} />;
    } else if (
      isBillingEnabled &&
      isLicenseValid &&
      location.pathname === LICENSE_CHECK_PATH
    ) {
      return <Redirect to={APPLICATIONS_URL} />;
    } else {
      return <Component {...props} />;
    }
  };
};
