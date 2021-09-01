import React from "react";
import { AppState } from "reducers";
import { getCurrentUser, getUserAuthError } from "selectors/usersSelectors";
import { connect } from "react-redux";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { Redirect } from "react-router";
import { APPLICATIONS_URL, AUTH_LOGIN_URL, BASE_URL } from "constants/routes";
import PageLoadingBar from "pages/common/PageLoadingBar";
import ServerUnavailable from "pages/common/ServerUnavailable";

type Props = {
  user?: User;
  authError: string;
};

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
