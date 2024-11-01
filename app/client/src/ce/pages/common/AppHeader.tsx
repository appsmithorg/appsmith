import React from "react";
import PageHeader from "pages/common/PageHeader";
import { Route, Switch } from "react-router";
import {
  VIEWER_PATH,
  BUILDER_PATH,
  BUILDER_PATH_DEPRECATED,
  VIEWER_PATH_DEPRECATED,
  ADMIN_SETTINGS_CATEGORY_PATH,
  VIEWER_CUSTOM_PATH,
  BUILDER_CUSTOM_PATH,
  BASE_URL,
} from "constants/routes";

import Navigation from "pages/AppViewer/Navigation";
import { Header as IDEHeader } from "pages/Editor/IDE/Header";

const IDE_HEADER_PATHS = [
  BUILDER_PATH_DEPRECATED,
  BUILDER_PATH,
  BUILDER_CUSTOM_PATH,
];

const NAVIGATION_PATHS = [
  VIEWER_PATH_DEPRECATED,
  VIEWER_PATH,
  VIEWER_CUSTOM_PATH,
];

const PAGE_HEADER_PATHS = [ADMIN_SETTINGS_CATEGORY_PATH, BASE_URL];

export const Routes = () => {
  return (
    <Switch>
      <Route path={IDE_HEADER_PATHS}>
        <IDEHeader />
      </Route>
      <Route path={NAVIGATION_PATHS}>
        <Navigation />
      </Route>

      <Route path={PAGE_HEADER_PATHS}>
        <PageHeader />
      </Route>
    </Switch>
  );
};
