/* eslint-disable @typescript-eslint/no-unused-vars */
import React from "react";
import styled from "styled-components";
import { Switch } from "react-router";
import {
  IDE_ADD_PATH,
  IDE_DATA_DETAIL_PATH,
  IDE_DATA_PATH,
  IDE_LIB_PATH,
  IDE_PAGE_PATH,
  IDE_SETTINGS_PATH,
} from "constants/routes";
import { SentryRoute } from "@appsmith/AppRouter";
import DataMainPane from "./DataState/MainPane";
import PageMainPane from "./PageState/MainPane";
import AddMainPane from "./AddState/MainPane";
import SettingsMainPane from "./SettingsState/MainPane";
import LibMainPane from "./LibraryState/MainPane";
import DataMainEmptyState from "./DataState/EmptyState";

const Container = styled.div`
  background-color: white;
  border-radius: 4px;
  margin-right: 5px;
`;

const MainPane = () => {
  return (
    <Switch>
      <SentryRoute component={DataMainEmptyState} exact path={IDE_DATA_PATH} />
      <SentryRoute component={DataMainPane} exact path={IDE_DATA_DETAIL_PATH} />
      <SentryRoute component={PageMainPane} path={IDE_PAGE_PATH} />
      <SentryRoute component={AddMainPane} exact path={IDE_ADD_PATH} />
      <SentryRoute component={LibMainPane} exact path={IDE_LIB_PATH} />
      <SentryRoute
        component={SettingsMainPane}
        exact
        path={IDE_SETTINGS_PATH}
      />
    </Switch>
  );
};

export default MainPane;
