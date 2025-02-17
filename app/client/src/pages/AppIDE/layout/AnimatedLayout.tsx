import React from "react";
import { useGridLayoutTemplate } from "./hooks/useGridLayoutTemplate";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import { AnimatedGridLayout, LayoutArea } from "components/AnimatedGridLayout";
import {
  useGitModEnabled,
  useGitProtectedMode,
} from "pages/Editor/gitSync/hooks/modHooks";
import { GitProtectedBranchCallout as GitProtectedBranchCalloutNew } from "git";
import BottomBar from "components/BottomBar";

import Sidebar from "./routers/Sidebar";
import LeftPane from "./routers/LeftPane";
import MainPane from "./routers/MainPane";
import RightPane from "./routers/RightPane";
import { Areas } from "./constants";
import { ProtectedCallout } from "../components/ProtectedCallout";

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

function AnimatedLayout() {
  const { areas, columns, rows } = useGridLayoutTemplate();

  if (columns.length === 0) {
    return null;
  }

  return (
    <>
      <GitProtectedBranchCallout />
      <EditorWrapperContainer>
        <AnimatedGridLayout
          areas={areas}
          columns={columns}
          height="100%"
          rows={rows}
          width="100vw"
        >
          <LayoutArea name={Areas.Sidebar}>
            <Sidebar />
          </LayoutArea>
          <LayoutArea name={Areas.Explorer}>
            <LeftPane />
          </LayoutArea>
          <LayoutArea name={Areas.WidgetEditor}>
            <MainPane id="app-body" />
          </LayoutArea>
          <LayoutArea name={Areas.PropertyPane}>
            <RightPane />
          </LayoutArea>
        </AnimatedGridLayout>
      </EditorWrapperContainer>
      <BottomBar />
    </>
  );
}

export { AnimatedLayout };
