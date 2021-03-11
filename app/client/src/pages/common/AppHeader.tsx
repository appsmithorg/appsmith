import React from "react";
import ReactDOM from "react-dom";
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

type Props = {
  getCurrentUser: () => void;
} & RouteComponentProps;

const headerRoot = document.getElementById("header-root");

class AppHeader extends React.Component<Props, any> {
  private container = document.createElement("div");

  componentDidMount() {
    this.props.getCurrentUser();
    headerRoot?.appendChild(this.container);
  }
  componentWillUnmount() {
    headerRoot?.removeChild(this.container);
  }
  get header() {
    return (
      <Switch>
        <Route component={AppEditorHeader} path={BUILDER_URL} />
        <Route component={AppViewerHeader} path={APP_VIEW_URL} />
        <Route component={LoginHeader} path={USER_AUTH_URL} />
        <Route component={PageHeader} path={BASE_URL} />
      </Switch>
    );
  }
  render() {
    return ReactDOM.createPortal(this.header, this.container);
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  getCurrentUser: () => dispatch(getCurrentUser()),
});

export default withRouter(connect(null, mapDispatchToProps)(AppHeader));
