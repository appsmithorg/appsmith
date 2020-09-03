import React from "react";
import EditorsRouter from "./routes";
import WidgetsEditor from "./WidgetsEditor";
import styled from "styled-components";
import Sidebar from "components/editorComponents/Sidebar";

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
        <EditorsRouter />
        <WidgetsEditor />
      </EditorContainer>
    </Container>
  );
};

MainContainer.displayName = "MainContainer";

export default MainContainer;
