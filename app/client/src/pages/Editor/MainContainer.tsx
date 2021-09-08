import React from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { Route, Switch } from "react-router";

import EditorsRouter from "./routes";
import WidgetsEditor from "./WidgetsEditor";
import { BUILDER_URL } from "constants/routes";
import Sidebar from "components/editorComponents/Sidebar";
import BottomBar from "./BottomBar";

import getFeatureFlags from "utils/featureFlags";

const SentryRoute = Sentry.withSentryRouting(Route);

const Container = styled.div`
  display: flex;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) =>
        getFeatureFlags().GIT ? props.theme.bottomBarHeight : "0px"}
  );
  background-color: ${(props) => props.theme.appBackground};
`;

const EditorContainer = styled.div`
  position: relative;
  width: calc(100vw - ${(props) => props.theme.sidebarWidth});
  display: flex;
  flex-direction: column;
`;

function MainContainer() {
  return (
    <>
      <Container>
        <Sidebar />
        <EditorContainer>
          <Switch>
            <SentryRoute component={WidgetsEditor} exact path={BUILDER_URL} />
            <SentryRoute component={EditorsRouter} />
          </Switch>
        </EditorContainer>
      </Container>
      {getFeatureFlags().GIT && <BottomBar />}
    </>
  );
}

MainContainer.displayName = "MainContainer";

export default MainContainer;
