import React, { useEffect, useRef } from "react";
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
import { tailwindLayers } from "constants/Layers";
import { protectedModeSelector } from "selectors/gitSyncSelectors";
import ProtectedCallout from "./ProtectedCallout";

/**
 * OldName: MainContainer
 */
function IDE() {
  const isPreviewMode = useSelector(previewModeSelector);
  const isCombinedPreviewMode = useSelector(combinedPreviewModeSelector);
  const isProtectedMode = useSelector(protectedModeSelector);

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (leftRef.current && rightRef.current) {
      if (isCombinedPreviewMode) {
        leftRef.current.style.marginRight = `-${leftRef.current.getBoundingClientRect().width}px`;
        rightRef.current.style.marginLeft = `-${rightRef.current.getBoundingClientRect().width}px`;
      } else {
        leftRef.current.style.marginRight = "0px";
        rightRef.current.style.marginLeft = "0px";
      }
    }
  }, [isCombinedPreviewMode]);

  return (
    <>
      {isProtectedMode && <ProtectedCallout />}
      <EditorWrapperContainer>
        <div
          className={classNames({
            [`transition-all transform duration-400 flex ${tailwindLayers.entityExplorer}`]:
              true,
            // relative: !isCombinedPreviewMode,
            "-translate-x-full": isCombinedPreviewMode,
          })}
          ref={leftRef}
        >
          <Sidebar />
          <LeftPane />
        </div>
        <MainPane id="app-body" />
        <div
          className={classNames({
            [`transition-all transform duration-400 h-full flex ${tailwindLayers.propertyPane}`]:
              true,
            // relative: !isCombinedPreviewMode,
            "translate-x-full": isCombinedPreviewMode,
          })}
          ref={rightRef}
        >
          <RightPane />
        </div>
      </EditorWrapperContainer>
      <BottomBar viewMode={isPreviewMode} />
    </>
  );
}

IDE.displayName = "AppsmithIDE";

export default React.memo(IDE);
