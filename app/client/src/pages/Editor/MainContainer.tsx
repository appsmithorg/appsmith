import React, { memo } from "react";
import EditorsRouter from "./routes";
import Sidebar from "./Sidebar";
import WidgetsEditor from "./WidgetsEditor";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  height: calc(100vh - ${props => props.theme.headerHeight});
`;

const EditorContainer = styled.div`
  position: relative;
  width: calc(100vw - ${props => props.theme.sidebarWidth});
`;

/* eslint-disable react/display-name */
const MainContainer = memo(() => {
  return (
    <Container>
      <Sidebar />
      <EditorContainer>
        <EditorsRouter />
        <WidgetsEditor />
      </EditorContainer>
    </Container>
  );
});

export default MainContainer;
