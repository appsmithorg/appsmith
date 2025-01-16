import React from "react";
import { useGridLayoutTemplate } from "./hooks/useGridLayoutTemplate";
import EditorWrapperContainer from "pages/Editor/commons/EditorWrapperContainer";
import { AnimatedGridLayout, LayoutArea } from "components/AnimatedGridLayout";
import BottomBar from "components/BottomBar";
import Sidebar from "../Sidebar";
import LeftPane from "../LeftPane";
import MainPane from "../MainPane";
import RightPane from "../RightPane";
import { Areas } from "./constants";
import ProtectedCallout from "../ProtectedCallout";
import {
  useGitModEnabled,
  useGitProtectedMode,
} from "pages/Editor/gitSync/hooks/modHooks";
import { GitProtectedBranchCallout as GitProtectedBranchCalloutNew } from "git";

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

interface AnimatedLayoutProps {
  showEnvSwitcher?: boolean;
}

function AnimatedLayout({ showEnvSwitcher = false }: AnimatedLayoutProps) {
  const { areas, columns, rows } = useGridLayoutTemplate();

  if (columns.length === 0) {
    return null;
  }

  return (
    <>
      <GitProtectedBranchCallout />
      <EditorWrapperContainer hasBottomBar={showEnvSwitcher}>
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
      {showEnvSwitcher && <BottomBar />}
    </>
  );
}

export { AnimatedLayout };
