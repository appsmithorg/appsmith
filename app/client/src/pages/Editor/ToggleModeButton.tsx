import React, { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import { TooltipComponent } from "design-system";
import Pen from "remixicon-react/PencilFillIcon";
import Eye from "remixicon-react/EyeLineIcon";
import { Indices } from "constants/Layers";

import { AppState } from "reducers";
import { APP_MODE } from "entities/App";

import AnalyticsUtil from "utils/AnalyticsUtil";
import { getAppMode } from "selectors/applicationSelectors";
import { setPreviewModeAction } from "actions/editorActions";
import { previewModeSelector } from "selectors/editorSelectors";

import { isExploringSelector } from "selectors/onboardingSelectors";

const ModeButton = styled.div<{
  active: boolean;
  showSelectedMode: boolean;
  type: string;
}>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  height: ${(props) => props.theme.smallHeaderHeight};
  width: ${(props) => props.theme.smallHeaderHeight};
  background: ${(props) =>
    props.active && props.showSelectedMode
      ? props.theme.colors.toggleMode.activeModeBackground
      : "transparent"};

  svg path {
    fill: ${(props) =>
      props.type !== "fill"
        ? "transparent"
        : props.active
        ? props.theme.colors.toggleMode.activeModeIcon
        : props.theme.colors.toggleMode.modeIcon};
    stroke: ${(props) =>
      props.type !== "stroke"
        ? "transparent"
        : props.active
        ? props.theme.colors.toggleMode.activeModeIcon
        : props.theme.colors.toggleMode.modeIcon};
  }

  svg rect:not(:first-child) {
    fill: ${(props) =>
      props.active
        ? props.theme.colors.toggleMode.activeModeIcon
        : props.theme.colors.toggleMode.modeIcon};
  }

  svg circle {
    stroke: ${(props) =>
      props.active
        ? props.theme.colors.toggleMode.activeModeIconCircleStroke
        : props.theme.colors.toggleMode.modeIconCircleStroke};
  }
`;

const Container = styled.div`
  display: flex;
  flex: 1;
  z-index: ${Indices.Layer1};
`;

function EditModeReset() {
  return (
    <TooltipComponent
      content={
        <>
          Edit Mode
          <span style={{ color: "#fff", marginLeft: 20 }}>V</span>
        </>
      }
      hoverOpenDelay={1000}
      position="bottom"
    >
      <Pen size={20} />
    </TooltipComponent>
  );
}

function ViewModeReset() {
  return (
    <TooltipComponent
      content={
        <>
          View Mode
          <span style={{ color: "#fff", marginLeft: 20 }}>V</span>
        </>
      }
      hoverOpenDelay={1000}
      position="bottom"
    >
      <Eye size={20} />
    </TooltipComponent>
  );
}

function ViewOrEditMode({ mode }: { mode?: APP_MODE }) {
  return mode === APP_MODE.EDIT ? <EditModeReset /> : <ViewModeReset />;
}

function ToggleModeButton({ showSelectedMode = true }) {
  const dispatch = useDispatch();
  const isExploring = useSelector(isExploringSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  const appMode = useSelector(getAppMode);

  const mode = useSelector((state: AppState) => state.entities.app.mode);
  const isViewMode = mode === APP_MODE.PUBLISHED;

  const onClickPreviewModeButton = useCallback(() => {
    dispatch(setPreviewModeAction(true));
  }, [dispatch, setPreviewModeAction]);

  return (
    <Container className="t--comment-mode-switch-toggle">
      <div style={{ display: "flex" }}>
        {!isExploring && !isViewMode && (
          <ModeButton
            active={!isPreviewMode}
            className="t--switch-comment-mode-off"
            onClick={() => {
              AnalyticsUtil.logEvent("COMMENTS_TOGGLE_MODE", {
                mode,
                source: "CLICK",
              });
              dispatch(setPreviewModeAction(false));
            }}
            showSelectedMode={showSelectedMode}
            type="fill"
          >
            <ViewOrEditMode mode={mode} />
          </ModeButton>
        )}
        {appMode === APP_MODE.EDIT && (
          <TooltipComponent
            content={
              <>
                Preview Mode
                <span style={{ color: "#fff", marginLeft: 20 }}>P</span>
              </>
            }
            hoverOpenDelay={1000}
            position="bottom"
          >
            <ModeButton
              active={isPreviewMode}
              className="t--switch-preview-mode-toggle"
              onClick={onClickPreviewModeButton}
              showSelectedMode={showSelectedMode}
              type="fill"
            >
              <Eye size={20} />
            </ModeButton>
          </TooltipComponent>
        )}
      </div>
    </Container>
  );
}

export default ToggleModeButton;
