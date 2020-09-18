import React from "react";
import EditorsRouter from "./routes";
import WidgetsEditor from "./WidgetsEditor";
import styled from "styled-components";
import Sidebar from "components/editorComponents/Sidebar";
import { Switch } from "react-router";
import AppRoute from "../common/AppRoute";
import { BUILDER_URL } from "constants/routes";

const Container = styled.div`
  display: flex;
  height: calc(100vh - ${props => props.theme.headerHeight});
`;

const EditorContainer = styled.div`
  position: relative;
  width: calc(100vw - ${props => props.theme.sidebarWidth});
`;

const MainContainer = () => {
  return (
    <Container>
      <Sidebar />
      <EditorContainer>
        <Switch>
          <AppRoute
            exact
            path={BUILDER_URL}
            component={WidgetsEditor}
            name={"WidgetsEditor"}
          />
          <AppRoute component={EditorsRouter} name={"OtherEditors"} />
        </Switch>
      </EditorContainer>
    </Container>
  );
};

MainContainer.displayName = "MainContainer";

export default MainContainer;
