import React from "react";

import { APPLICATIONS_URL, AUTH_LOGIN_URL, BASE_URL } from "constants/routes";
import type { User } from "constants/userConstants";
import { ANONYMOUS_USERNAME } from "constants/userConstants";
import type { AppState } from "ee/reducers";
import ServerUnavailable from "pages/common/ErrorPages/ServerUnavailable";
import PageLoadingBar from "pages/common/PageLoadingBar";
import { connect } from "react-redux";
import { Redirect } from "react-router";
import { getCurrentUser, getUserAuthError } from "selectors/usersSelectors";

interface Props {
  user?: User;
  authError: string;
}

function LandingScreen(props: Props) {
  if (props.user && window.location.pathname === BASE_URL) {
    if (props.user.email === ANONYMOUS_USERNAME) {
      return <Redirect to={AUTH_LOGIN_URL} />;
    } else {
      return <Redirect to={APPLICATIONS_URL} />;
    }
  }
  if (props.authError && props.authError.length) {
    return <ServerUnavailable />;
  }
  return <PageLoadingBar />;
}

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
  authError: getUserAuthError(state),
});

export default connect(mapStateToProps)(LandingScreen);
