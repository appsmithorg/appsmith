import React from "react";
import { useSelector } from "react-redux";

import BottomBar from "components/BottomBar";
import {
  combinedPreviewModeSelector,
  previewModeSelector,
} from "selectors/editorSelectors";
import EditorWrapperContainer from "../commons/EditorWrapperContainer";
import Sidebar from "pages/Editor/IDE/Sidebar";
import LeftPane from "./LeftPane";
import MainPane from "./MainPane";
import RightPane from "./RightPane";
import classNames from "classnames";
import { tailwindLayers } from "../../../constants/Layers";

/**
 * OldName: MainContainer
 */
function IDE() {
  const isPreviewMode = useSelector(previewModeSelector);
  const isCombinedPreviewMode = useSelector(combinedPreviewModeSelector);

  return (
    <>
      <EditorWrapperContainer>
        <div
          className={classNames({
            [`transition-transform transform duration-400 flex ${tailwindLayers.entityExplorer}`]:
              true,
            relative: !isCombinedPreviewMode,
            "-translate-x-full fixed": isCombinedPreviewMode,
          })}
        >
          <Sidebar />
          <LeftPane />
        </div>
        <MainPane id="app-body" />
        <div
          className={classNames({
            [`transition-transform transform duration-400 ${tailwindLayers.propertyPane}`]:
              true,
            relative: !isCombinedPreviewMode,
            "translate-x-full fixed right-0": isCombinedPreviewMode,
          })}
        >
          <RightPane />
        </div>
      </EditorWrapperContainer>
      <BottomBar viewMode={isPreviewMode} />
    </>
  );
}

IDE.displayName = "AppsmithIDE";

export default IDE;
