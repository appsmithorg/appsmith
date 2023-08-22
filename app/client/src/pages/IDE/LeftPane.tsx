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
import DataLeftPane from "./DataState/LeftPane";
import PageLeftPane from "./PageState/LeftPane";
import AddLeftPane from "./AddState/LeftPane";
import SettingsLeftPane from "./SettingsState/LeftPane";
import LibLeftPane from "./LibraryState/LeftPane";

const Container = styled.div`
  background-color: white;
  margin-top: 4px;
  border-radius: 4px;
`;

const LeftPane = () => {
  return (
    <Container>
      <Switch>
        <SentryRoute component={DataLeftPane} exact path={IDE_DATA_PATH} />
        <SentryRoute
          component={DataLeftPane}
          exact
          path={IDE_DATA_DETAIL_PATH}
        />
        <SentryRoute component={PageLeftPane} exact path={IDE_PAGE_PATH} />
        <SentryRoute component={AddLeftPane} exact path={IDE_ADD_PATH} />
        <SentryRoute component={LibLeftPane} exact path={IDE_LIB_PATH} />
        <SentryRoute
          component={SettingsLeftPane}
          exact
          path={IDE_SETTINGS_PATH}
        />
      </Switch>
    </Container>
  );
};

export default LeftPane;
