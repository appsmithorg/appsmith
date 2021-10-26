import React from "react";
import ReactDOM from "react-dom";
import PageHeader from "pages/common/PageHeader";
import LoginHeader from "pages/common/LoginHeader";
import { Route, Switch } from "react-router";
import {
  VIEWER_URL,
  BASE_URL,
  BUILDER_URL,
  SETUP,
  SIGNUP_SUCCESS_URL,
  USER_AUTH_URL,
} from "constants/routes";
import { withRouter, RouteComponentProps } from "react-router";
import AppViewerHeader from "pages/AppViewer/viewer/AppViewerHeader";
import AppEditorHeader from "pages/Editor/EditorHeader";

type Props = RouteComponentProps;

const headerRoot = document.getElementById("header-root");

class AppHeader extends React.Component<Props, any> {
  private container = document.createElement("div");

  componentDidMount() {
    headerRoot?.appendChild(this.container);
  }
  componentWillUnmount() {
    headerRoot?.removeChild(this.container);
  }
  get header() {
    return (
      <Switch>
        <Route component={AppEditorHeader} path={BUILDER_URL} />
        <Route component={AppViewerHeader} exact path={VIEWER_URL} />
        <Route component={LoginHeader} path={USER_AUTH_URL} />
        <Route path={SETUP} />
        <Route path={SIGNUP_SUCCESS_URL} />
        <Route component={PageHeader} path={BASE_URL} />
      </Switch>
    );
  }
  render() {
    return ReactDOM.createPortal(this.header, this.container);
  }
}

export default withRouter(AppHeader);
