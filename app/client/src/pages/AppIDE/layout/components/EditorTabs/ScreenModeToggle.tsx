import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Tooltip } from "@appsmith/ads";

import { getIDEViewMode } from "../../../../../selectors/ideSelectors";
import { EditorViewMode } from "../../../../../IDE/Interfaces/EditorTypes";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  MAXIMIZE_BUTTON_TOOLTIP,
  MINIMIZE_BUTTON_TOOLTIP,
  createMessage,
} from "ee/constants/messages";
import { setIdeEditorViewMode } from "../../../../../actions/ideActions";
import type { AppState } from "ee/reducers";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { Nudge } from "../../../../../IDE/Components/Nudge";

interface Props {
  showNudge?: boolean;
  dismissNudge?: () => void;
}

export const ScreenModeToggle = (props: Props) => {
  const { dismissNudge, showNudge = false } = props;
  const dispatch = useDispatch();
  const ideViewMode = useSelector(getIDEViewMode);
  const isAnimatedIDEEnabled = useSelector((state: AppState) => {
    return selectFeatureFlagCheck(
      state,
      FEATURE_FLAG.release_ide_animations_enabled,
    );
  });

  const switchToFullScreen = useCallback(() => {
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.FullScreen,
    });

    // Animating using https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
    // this has limited availability right now
    if ("startViewTransition" in document && isAnimatedIDEEnabled) {
      document.startViewTransition(() => {
        dispatch(setIdeEditorViewMode(EditorViewMode.FullScreen));
      });
    } else {
      dispatch(setIdeEditorViewMode(EditorViewMode.FullScreen));
    }
  }, [dispatch, isAnimatedIDEEnabled]);

  const switchToSplitScreen = useCallback(() => {
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.SplitScreen,
    });

    if (dismissNudge) {
      dismissNudge();
    }

    if ("startViewTransition" in document && isAnimatedIDEEnabled) {
      document.startViewTransition(() => {
        dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
      });
    } else {
      dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
    }
  }, [dispatch, dismissNudge, isAnimatedIDEEnabled]);

  const minimiseButton = useMemo(
    () => (
      <Button
        className="ml-auto !min-w-[24px]"
        data-testid={"t--ide-minimize"}
        id={"editor-mode-minimize"}
        isIconButton
        kind="tertiary"
        onClick={switchToSplitScreen}
        startIcon={"minimize-v3"}
      />
    ),
    [switchToSplitScreen],
  );

  if (ideViewMode === EditorViewMode.SplitScreen) {
    return (
      <Tooltip
        content={createMessage(MAXIMIZE_BUTTON_TOOLTIP)}
        key={createMessage(MAXIMIZE_BUTTON_TOOLTIP)}
      >
        <Button
          className="ml-auto !min-w-[24px]"
          data-testid={"t--ide-maximize"}
          id={"editor-mode-maximize"}
          isIconButton
          kind="tertiary"
          onClick={switchToFullScreen}
          startIcon={"maximize-v3"}
        />
      </Tooltip>
    );
  }

  if (showNudge && dismissNudge) {
    return (
      <Nudge
        align="center"
        delayOpen={500}
        message="Write code and configure UI elements side by side"
        onDismissClick={dismissNudge}
        side="left"
        trigger={minimiseButton}
      />
    );
  }

  return (
    <Tooltip
      content={createMessage(MINIMIZE_BUTTON_TOOLTIP)}
      key={createMessage(MINIMIZE_BUTTON_TOOLTIP)}
      placement="left"
    >
      {minimiseButton}
    </Tooltip>
  );
};
