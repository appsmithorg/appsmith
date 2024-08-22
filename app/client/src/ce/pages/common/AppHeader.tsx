import React from "react";

import {
  ADMIN_SETTINGS_CATEGORY_PATH,
  BASE_URL,
  BUILDER_CUSTOM_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  CUSTOM_WIDGETS_DEPRECATED_EDITOR_ID_PATH,
  CUSTOM_WIDGETS_EDITOR_ID_PATH,
  CUSTOM_WIDGETS_EDITOR_ID_PATH_CUSTOM,
  SETUP,
  SIGNUP_SUCCESS_URL,
  USER_AUTH_URL,
  VIEWER_CUSTOM_PATH,
  VIEWER_PATH,
  VIEWER_PATH_DEPRECATED,
} from "constants/routes";
import Navigation from "pages/AppViewer/Navigation";
import { Header as AppIDEHeader } from "pages/Editor/IDE/Header";
import PageHeader from "pages/common/PageHeader";
import { Route, Switch } from "react-router";
import type { RouteComponentProps } from "react-router";

export type Props = RouteComponentProps;

export const headerRoot = document.getElementById("header-root");

export const Routes = () => {
  return (
    <Switch>
      <Route component={PageHeader} path={ADMIN_SETTINGS_CATEGORY_PATH} />
      <Route component={undefined} path={USER_AUTH_URL} />
      <Route path={SETUP} />
      <Route path={SIGNUP_SUCCESS_URL} />
      <Route component={undefined} exact path={CUSTOM_WIDGETS_EDITOR_ID_PATH} />
      <Route
        component={undefined}
        exact
        path={CUSTOM_WIDGETS_EDITOR_ID_PATH_CUSTOM}
      />
      <Route
        component={undefined}
        exact
        path={CUSTOM_WIDGETS_DEPRECATED_EDITOR_ID_PATH}
      />
      <Route component={AppIDEHeader} path={BUILDER_PATH_DEPRECATED} />
      <Route component={Navigation} path={VIEWER_PATH_DEPRECATED} />
      <Route component={AppIDEHeader} path={BUILDER_PATH} />
      <Route component={AppIDEHeader} path={BUILDER_CUSTOM_PATH} />
      <Route component={Navigation} path={VIEWER_PATH} />
      <Route component={Navigation} path={VIEWER_CUSTOM_PATH} />
      <Route component={PageHeader} path={BASE_URL} />
    </Switch>
  );
};
