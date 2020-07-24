import React from "react";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { AppState } from "@appsmith/reducers";
import { getCurrentUser } from "@appsmith/selectors/usersSelectors";
import { connect } from "react-redux";
import { User } from "@appsmith/constants/userConstants";
import { Redirect } from "react-router";
import { APPLICATIONS_URL } from "constants/routes";

type Props = {
  user?: User;
};

const App = (props: Props) => {
  if (props.user) {
    return <Redirect to={APPLICATIONS_URL} />;
  }
  return <CenteredWrapper>Checking auth</CenteredWrapper>;
};

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
});

export default connect(mapStateToProps)(App);
