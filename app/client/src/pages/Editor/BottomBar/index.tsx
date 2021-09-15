import React from "react";
import styled from "styled-components";
import QuickGitActions from "pages/Editor/gitSync/QuickGitActions";
import { Layers } from "constants/Layers";
import { DebuggerTrigger } from "components/editorComponents/Debugger";

const Container = styled.div`
  position: relative;
  width: 100%;
  height: ${(props) => props.theme.bottomBarHeight};
  display: flex;
  justify-content: space-between;
  background-color: ${(props) => props.theme.colors.editorBottomBar.background};
  z-index: ${Layers.bottomBar};
`;

export default function BottomBar() {
  return (
    <Container>
      <QuickGitActions />
      <DebuggerTrigger />
    </Container>
  );
}
