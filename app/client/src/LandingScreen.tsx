import React from "react";
import type { DefaultRootState } from "react-redux";
import { getCurrentUser, getUserAuthError } from "selectors/usersSelectors";
import { connect, useSelector } from "react-redux";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import { Redirect } from "react-router";
import { APPLICATIONS_URL, AUTH_LOGIN_URL, BASE_URL } from "constants/routes";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ServerUnavailable from "pages/common/ErrorPages/ServerUnavailable";
import { getOrganizationConfig } from "ce/selectors/organizationSelectors";
import { isWithinAnOrganization } from "ce/selectors/organizationSelectors";

interface Props {
  user?: User;
  authError: string;
}

function LandingScreen(props: Props) {
  const organizationConfig = useSelector(getOrganizationConfig);
  const isWithinOrg = useSelector(isWithinAnOrganization);

  const LOGIN_SLUG = "login";
  const hasLoginSlug = organizationConfig.slug === LOGIN_SLUG;

  if (window.location.pathname === BASE_URL) {
    // User exists but is anonymous or doesn't have org access
    if (props.user && props.user.email === ANONYMOUS_USERNAME) {
      return <Redirect to={AUTH_LOGIN_URL} />;
    }

    // User doesn't exist or has login slug but not in an org
    if (!props.user || (hasLoginSlug && !isWithinOrg)) {
      return <Redirect to={AUTH_LOGIN_URL} />;
    }

    // Authenticated user with proper access
    if (props.user) {
      return <Redirect to={APPLICATIONS_URL} />;
    }
  }

  if (props.authError && props.authError.length) {
    return <ServerUnavailable />;
  }

  return <PageLoadingBar />;
}

const mapStateToProps = (state: DefaultRootState) => ({
  user: getCurrentUser(state),
  authError: getUserAuthError(state),
});

export default connect(mapStateToProps)(LandingScreen);
