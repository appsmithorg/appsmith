import { getAppsmithConfigs } from "@appsmith/configs";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { requiresAuth } from "pages/UserAuth/requiresAuthHOC";
import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import Landing from "pages/setup/Welcome";
import { Center } from "pages/setup/common";
import { IconSize, Spinner } from "design-system-old";
import { isValidLicense } from "@appsmith/selectors/tenantSelectors";
import { redirectUserAfterSignup } from "@appsmith/utils/signupHelpers";

export function SignupSuccess() {
  const dispatch = useDispatch();
  const urlObject = new URL(window.location.href);
  const redirectUrl = urlObject?.searchParams.get("redirectUrl") ?? "";
  const shouldEnableFirstTimeUserOnboarding = urlObject?.searchParams.get(
    "enableFirstTimeUserExperience",
  );
  const validLicense = useSelector(isValidLicense);
  useEffect(() => {
    PerformanceTracker.stopTracking(PerformanceTransactionName.SIGN_UP);
  }, []);

  const redirectUsingQueryParam = useCallback(
    () =>
      redirectUserAfterSignup(
        redirectUrl,
        shouldEnableFirstTimeUserOnboarding,
        validLicense,
        dispatch,
      ),
    [],
  );

  const onGetStarted = useCallback((role?: string, useCase?: string) => {
    dispatch({
      type: ReduxActionTypes.UPDATE_USER_DETAILS_INIT,
      payload: {
        role,
        useCase,
      },
    });
    redirectUsingQueryParam();
  }, []);

  const user = useSelector(getCurrentUser);
  const { cloudHosting } = getAppsmithConfigs();
  const isCypressEnv = !!(window as any).Cypress;

  /*
   *  Proceed with redirection,
   *    For all local deployments
   *    For a super user, since we already collected role and useCase during signup
   *    For a normal user, who has filled in their role and useCase and try to visit signup-success url by entering manually.
   *    For an invited user, we don't want to collect the data. we just want to redirect to the workspace they have been invited to.
   *      We identify an invited user based on `enableFirstTimeUserExperience` flag in url.
   */
  //TODO(Balaji): Factor in case, where user had closed the tab, while filling the form.And logs back in again.
  if (
    (!cloudHosting && !isCypressEnv) ||
    user?.isSuperUser ||
    (user?.role && user?.useCase) ||
    shouldEnableFirstTimeUserOnboarding !== "true"
  ) {
    redirectUsingQueryParam();
    // Showing a loader until the redirect
    return (
      <Center>
        <Spinner size={IconSize.XXXXL} />
      </Center>
    );
  }
  return <Landing forSuperUser={false} onGetStarted={onGetStarted} />;
}

export default requiresAuth(SignupSuccess);
