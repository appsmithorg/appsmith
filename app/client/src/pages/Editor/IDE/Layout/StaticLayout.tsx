import React from "react";

import BottomBar from "components/BottomBar";
import EditorWrapperContainer from "../../commons/EditorWrapperContainer";
import Sidebar from "pages/Editor/IDE/Sidebar";
import LeftPane from "../LeftPane";
import MainPane from "../MainPane";
import RightPane from "../RightPane";
import ProtectedCallout from "../ProtectedCallout";
import { useGridLayoutTemplate } from "./hooks/useGridLayoutTemplate";
import styled from "styled-components";
import { Areas } from "./constants";
import { useGitModEnabled } from "pages/Editor/gitSync/hooks/modHooks";
import {
  GitProtectedBranchCallout as GitProtectedBranchCalloutNew,
  useGitProtectedMode,
} from "git";

function GitProtectedBranchCallout() {
  const isGitModEnabled = useGitModEnabled();
  const isProtectedMode = useGitProtectedMode();

  if (isGitModEnabled) {
    return <GitProtectedBranchCalloutNew />;
  }

  if (isProtectedMode) {
    return <ProtectedCallout />;
  }

  return null;
}

const GridContainer = styled.div`
  display: grid;
  width: 100vw;
  height: 100%;
`;

const LayoutContainer = styled.div<{ name: string }>`
  position: relative;
  grid-area: ${(props) => props.name};
  overflow: auto;
`;

export const StaticLayout = React.memo(() => {
  const { areas, columns } = useGridLayoutTemplate();

  const isSidebarVisible = columns[0] !== "0px";

  return (
    <>
      <GitProtectedBranchCallout />
      <EditorWrapperContainer>
        <GridContainer
          style={{
            gridTemplateRows: "100%",
            gridTemplateAreas: areas
              .map((area) => `"${area.join(" ")}"`)
              .join("\n"),
            gridTemplateColumns: columns.join(" "),
          }}
        >
          <LayoutContainer name={Areas.Sidebar}>
            {isSidebarVisible ? <Sidebar /> : <div />}
          </LayoutContainer>
          <LayoutContainer name={Areas.Explorer}>
            <LeftPane />
          </LayoutContainer>
          <LayoutContainer name={Areas.WidgetEditor}>
            <MainPane id="app-body" />
          </LayoutContainer>
          <LayoutContainer name={Areas.PropertyPane}>
            <RightPane />
          </LayoutContainer>
        </GridContainer>
      </EditorWrapperContainer>
      <BottomBar />
    </>
  );
});
