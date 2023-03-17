import React from "react";
import ReactDOM from "react-dom";
import PageHeader from "pages/common/PageHeader";
import { Route, Switch } from "react-router";
import {
  VIEWER_PATH,
  BASE_URL,
  BUILDER_PATH,
  SETUP,
  SIGNUP_SUCCESS_URL,
  USER_AUTH_URL,
  BUILDER_PATH_DEPRECATED,
  VIEWER_PATH_DEPRECATED,
  ADMIN_SETTINGS_CATEGORY_PATH,
  VIEWER_CUSTOM_PATH,
  BUILDER_CUSTOM_PATH,
} from "constants/routes";
import { withRouter, RouteComponentProps } from "react-router";
import AppViewerHeader from "pages/AppViewer/AppViewerHeader";
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
        <Route component={PageHeader} path={ADMIN_SETTINGS_CATEGORY_PATH} />
        <Route component={undefined} path={USER_AUTH_URL} />
        <Route path={SETUP} />
        <Route path={SIGNUP_SUCCESS_URL} />
        <Route component={AppEditorHeader} path={BUILDER_PATH_DEPRECATED} />
        <Route component={AppViewerHeader} path={VIEWER_PATH_DEPRECATED} />
        <Route component={AppEditorHeader} path={BUILDER_PATH} />
        <Route component={AppEditorHeader} path={BUILDER_CUSTOM_PATH} />
        <Route component={AppViewerHeader} path={VIEWER_PATH} />
        <Route component={AppViewerHeader} path={VIEWER_CUSTOM_PATH} />
        <Route component={PageHeader} path={BASE_URL} />
      </Switch>
    );
  }
  render() {
    return ReactDOM.createPortal(this.header, this.container);
  }
}

export default withRouter(AppHeader);
