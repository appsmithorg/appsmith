import React from "react";
import EditorsRouter from "./routes";
import WidgetsEditor from "./WidgetsEditor";
import styled from "styled-components";
import Sidebar from "components/editorComponents/Sidebar";
// import AppComments from "components/ads/Comments/AppComments/AppComments";
import { Route, Switch } from "react-router";
import { BUILDER_URL } from "constants/routes";

import * as Sentry from "@sentry/react";
const SentryRoute = Sentry.withSentryRouting(Route);

const Container = styled.div`
  display: flex;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
  background-color: ${(props) => props.theme.appBackground};
`;

const EditorContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: auto;
`;

const MainContainer = () => {
  return (
    <Container>
      <Sidebar />
      <EditorContainer>
        <Switch>
          <SentryRoute exact path={BUILDER_URL} component={WidgetsEditor} />
          <SentryRoute component={EditorsRouter} />
        </Switch>
      </EditorContainer>
      {/* <AppComments /> */}
    </Container>
  );
};

MainContainer.displayName = "MainContainer";

export default MainContainer;
