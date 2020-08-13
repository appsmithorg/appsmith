import React from "react";
import { connect } from "react-redux";
import { getCurrentUser } from "actions/authActions";
import PageHeader from "pages/common/PageHeader";
import LoginHeader from "pages/common/LoginHeader";
import { Route, Switch } from "react-router";
import {
  APP_VIEW_URL,
  BASE_URL,
  BUILDER_URL,
  USER_AUTH_URL,
} from "constants/routes";
import { withRouter, RouteComponentProps } from "react-router";
import AppViewerHeader from "pages/AppViewer/viewer/AppViewerHeader";
import AppEditorHeader from "pages/Editor/EditorHeader";

type Props = { getCurrentUser: () => void } & RouteComponentProps;

class AppHeader extends React.Component<Props, any> {
  componentDidMount() {
    this.props.getCurrentUser();
  }
  render() {
    return (
      <React.Fragment>
        <Switch>
          <Route path={BUILDER_URL} component={AppEditorHeader} />
          <Route path={APP_VIEW_URL} component={AppViewerHeader} />
          <Route path={USER_AUTH_URL} component={LoginHeader} />
          <Route path={BASE_URL} component={PageHeader} />
        </Switch>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (dispatch: any) => ({
  getCurrentUser: () => dispatch(getCurrentUser()),
});

export default withRouter(connect(null, mapStateToProps)(AppHeader));
