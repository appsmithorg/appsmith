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
import DataMainEmptyState from "./DataState/EmptyState";
import WidgetsEditor from "../Editor/WidgetsEditor";

const Container = styled.div`
  background-color: white;
  border-radius: 4px;
  margin-right: 5px;
  flex: 1;
`;

const MainPane = () => {
  return (
    <Container>
      <Switch>
        <SentryRoute
          component={DataMainEmptyState}
          exact
          path={IDE_DATA_PATH}
        />
        <SentryRoute
          component={DataMainPane}
          exact
          path={IDE_DATA_DETAIL_PATH}
        />
        <SentryRoute component={WidgetsEditor} path={IDE_PAGE_PATH} />
        <SentryRoute component={WidgetsEditor} exact path={IDE_ADD_PATH} />
        <SentryRoute component={WidgetsEditor} exact path={IDE_LIB_PATH} />
        <SentryRoute component={WidgetsEditor} exact path={IDE_SETTINGS_PATH} />
      </Switch>
    </Container>
  );
};

export default MainPane;
