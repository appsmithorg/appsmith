import React from "react";

import {
  useGitModEnabled,
  useGitProtectedMode,
} from "pages/Editor/gitSync/hooks/modHooks";
import { GitProtectedBranchCallout as GitProtectedBranchCalloutNew } from "git";
import BottomBar from "components/BottomBar";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";

import Sidebar from "./routers/Sidebar";
import LeftPane from "./routers/LeftPane";
import MainPane from "./routers/MainPane";
import RightPane from "./routers/RightPane";
import { ProtectedCallout } from "../components/ProtectedCallout";
import { useGridLayoutTemplate } from "./hooks/useGridLayoutTemplate";
import { Areas } from "./constants";
import {
  GridContainer,
  LayoutContainer,
} from "IDE/Components/LayoutComponents";

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
