import React from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";
import { Route, Switch } from "react-router";
import EditorsRouter from "./routes";
import WidgetsEditor from "./WidgetsEditor";
import Sidebar from "components/editorComponents/Sidebar";
import { BUILDER_CHECKLIST_URL, BUILDER_URL } from "constants/routes";
import OnboardingChecklist from "./FirstTimeUserExperience/Checklist";
const SentryRoute = Sentry.withSentryRouting(Route);

const Container = styled.div`
  display: flex;
  height: calc(100vh - ${(props) => props.theme.smallHeaderHeight});
  background-color: ${(props) => props.theme.appBackground};
`;

const EditorContainer = styled.div`
  position: relative;
  width: calc(100vw - ${(props) => props.theme.sidebarWidth});
`;

function MainContainer() {
  return (
    <Container>
      <Sidebar />
      <EditorContainer>
        <Switch>
          <SentryRoute component={WidgetsEditor} exact path={BUILDER_URL} />
          <SentryRoute
            component={OnboardingChecklist}
            exact
            path={BUILDER_CHECKLIST_URL}
          />
          <SentryRoute component={EditorsRouter} />
        </Switch>
      </EditorContainer>
    </Container>
  );
}

MainContainer.displayName = "MainContainer";

export default MainContainer;
