import React from "react";
import CenteredWrapper from "components/designSystems/appsmith/CenteredWrapper";
import { AppState } from "reducers";
import { getCurrentUser } from "selectors/usersSelectors";
import { connect } from "react-redux";
import { User } from "constants/userConstants";
import { Redirect } from "react-router";
import { APPLICATIONS_URL } from "constants/routes";
import { Spinner } from "@blueprintjs/core";

type Props = {
  user?: User;
};

const App = (props: Props) => {
  if (props.user) {
    return <Redirect to={APPLICATIONS_URL} />;
  }
  return (
    <CenteredWrapper>
      <Spinner />
    </CenteredWrapper>
  );
};

const mapStateToProps = (state: AppState) => ({
  user: getCurrentUser(state),
});

export default connect(mapStateToProps)(App);
