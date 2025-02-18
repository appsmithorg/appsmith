import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { requiresAuth } from "pages/UserAuth/requiresAuthHOC";
import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser } from "selectors/usersSelectors";
import UserWelcomeScreen from "pages/setup/UserWelcomeScreen";
import { Center } from "pages/setup/common";
import { Spinner } from "@appsmith/ads";
import { isValidLicense } from "ee/selectors/organizationSelectors";
import { redirectUserAfterSignup } from "ee/utils/signupHelpers";
import { setUserSignedUpFlag } from "utils/storage";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";

export function SignupSuccess() {
  const dispatch = useDispatch();
  const urlObject = new URL(window.location.href);
  const redirectUrl = urlObject?.searchParams.get("redirectUrl") ?? "";
  const shouldEnableFirstTimeUserOnboarding = urlObject?.searchParams.get(
    "enableFirstTimeUserExperience",
  );
  const validLicense = useSelector(isValidLicense);
  const user = useSelector(getCurrentUser);

  useEffect(() => {
    user?.email && setUserSignedUpFlag(user?.email);
  }, []);

  const isNonInvitedUser = shouldEnableFirstTimeUserOnboarding === "true";

  const redirectUsingQueryParam = useCallback(
    () =>
      redirectUserAfterSignup(
        redirectUrl,
        shouldEnableFirstTimeUserOnboarding,
        validLicense,
        dispatch,
        isNonInvitedUser,
      ),
    [],
  );

  const onGetStarted = useCallback((proficiency?: string, useCase?: string) => {
    dispatch({
      type: ReduxActionTypes.UPDATE_USER_DETAILS_INIT,
      payload: {
        proficiency,
        useCase,
      },
    });
    AnalyticsUtil.logEvent("GET_STARTED_CLICKED", {
      proficiency,
      goal: useCase,
    });
    redirectUsingQueryParam();
  }, []);

  /*
   *  Proceed with redirection,
   *    For a super user, since we already collected role and useCase during signup
   *    For a normal user, who has filled in their role and useCase and try to visit signup-success url by entering manually.
   *    For an invited user, we don't want to collect the data. we just want to redirect to the workspace they have been invited to.
   *    We identify an invited user based on `enableFirstTimeUserExperience` flag in url.
   */
  //TODO(Balaji): Factor in case, where user had closed the tab, while filling the form.And logs back in again.
  if (
    user?.isSuperUser ||
    ((user?.role || user?.proficiency) && user?.useCase) ||
    shouldEnableFirstTimeUserOnboarding !== "true"
  ) {
    redirectUsingQueryParam();

    // Showing a loader until the redirect
    return (
      <Center>
        <Spinner size="lg" />
      </Center>
    );
  }

  return <UserWelcomeScreen isSuperUser={false} onGetStarted={onGetStarted} />;
}

export default requiresAuth(SignupSuccess);
