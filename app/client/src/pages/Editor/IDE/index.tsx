import React from "react";
import { useSelector } from "react-redux";

import BottomBar from "components/BottomBar";
import { previewModeSelector } from "selectors/editorSelectors";
import EditorWrapperContainer from "../commons/EditorWrapperContainer";
import Sidebar from "pages/Editor/IDE/Sidebar";
import LeftPane from "./LeftPane";
import MainPane from "./MainPane";
import RightPane from "./RightPane";

/**
 * OldName: MainContainer
 */
function IDE() {
  const isPreviewMode = useSelector(previewModeSelector);

  return (
    <>
      <EditorWrapperContainer>
        <Sidebar />
        <LeftPane />
        <MainPane id="app-body" />
        <RightPane />
      </EditorWrapperContainer>
      <BottomBar viewMode={isPreviewMode} />
    </>
  );
}

IDE.displayName = "AppsmithIDE";

export default IDE;
