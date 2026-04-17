import SnapShotBannerCTA from "pages/Editor/CanvasLayoutConversion/SnapShotBannerCTA";
import React, { useState } from "react";
import styled from "styled-components";
import { MainContainerWrapper } from "./MainContainerWrapper";
import { PageDslMonacoSplit } from "./PageDslMonacoSplit";
import { AppSettingsTabs } from "pages/AppIDE/components/AppSettings/types";
import { useSelector } from "react-redux";
import {
  getCanvasWidth,
  getCurrentPageId,
  previewModeSelector,
} from "selectors/editorSelectors";
import { getAppSettingsPaneContext } from "selectors/appSettingsPaneSelectors";
import { useShowSnapShotBanner } from "pages/Editor/CanvasLayoutConversion/hooks/useShowSnapShotBanner";
import { useGitProtectedMode } from "pages/Editor/gitSync/hooks/modHooks";

// Fixed to the viewport so parent overflow:hidden on the IDE shell cannot clip it.
const CodeModeToggle = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--ads-v2-color-border);
  background: var(--ads-v2-color-bg);
  color: var(--ads-v2-color-fg);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: background 0.15s;

  &:hover {
    background: var(--ads-v2-color-bg-subtle);
  }
`;

// Wrapper that enables the toggle button to be absolutely positioned within
// the canvas area.
const CanvasWrapper = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

/**
 * LayoutSystemBasedPageViewer
 *
 * Renders the main canvas. In "GenSmith Code Mode" it switches to a
 * split-screen layout: Monaco DSL editor (left) + live canvas (right).
 *
 * The toggle button (top-right corner) persists across both modes.
 */
export const LayoutSystemBasedPageViewer = ({
  navigationHeight,
}: {
  navigationHeight: number;
}) => {
  const currentPageId = useSelector(getCurrentPageId);
  const isPreviewMode = useSelector(previewModeSelector);
  const isProtectedMode = useGitProtectedMode();
  const appSettingsPaneContext = useSelector(getAppSettingsPaneContext);
  const canvasWidth = useSelector(getCanvasWidth);
  const shouldShowSnapShotBanner = useShowSnapShotBanner(
    isPreviewMode || isProtectedMode,
  );

  const [isCodeMode, setIsCodeMode] = useState(false);

  const canvasContent = (
    <>
      {shouldShowSnapShotBanner && <SnapShotBannerCTA />}
      <MainContainerWrapper
        canvasWidth={canvasWidth}
        currentPageId={currentPageId}
        isAppSettingsPaneWithNavigationTabOpen={
          AppSettingsTabs.Navigation === appSettingsPaneContext?.type
        }
        isPreviewMode={isPreviewMode}
        isProtectedMode={isProtectedMode}
        navigationHeight={navigationHeight}
        shouldShowSnapShotBanner={shouldShowSnapShotBanner}
      />
    </>
  );

  if (isCodeMode) {
    return (
      <PageDslMonacoSplit onClose={() => setIsCodeMode(false)}>
        {canvasContent}
      </PageDslMonacoSplit>
    );
  }

  return (
    <CanvasWrapper>
      <CodeModeToggle
        aria-label="Open GenSmith code and AI DSL editor"
        data-testid="t--gensmith-code-mode-toggle"
        onClick={() => setIsCodeMode(true)}
        title="Open GenSmith Code Mode (Monaco JSON + AI)"
        type="button"
      >
        GenSmith
      </CodeModeToggle>
      {canvasContent}
    </CanvasWrapper>
  );
};
