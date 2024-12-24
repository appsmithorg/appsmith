import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Flex,
  Icon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  Tooltip,
} from "@appsmith/ads";

import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import {
  MAXIMIZE_BUTTON_TOOLTIP,
  MINIMIZE_BUTTON_TOOLTIP,
  createMessage,
} from "ee/constants/messages";
import { setIdeEditorViewMode } from "actions/ideActions";
import type { AppState } from "ee/reducers";
import { selectFeatureFlagCheck } from "ee/selectors/featureFlagsSelectors";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import styled from "styled-components";

const StyledPopoverContent = styled(PopoverContent)`
  background: var(--ads-v2-color-bg-emphasis-max);
  box-shadow: 0 1px 20px 0 #4c56641c;
  border: none;
`;

const FocusButton = styled(Button)`
  border: 2px solid #8bb0fa !important;
`;

const CloseIcon = styled(Icon)`
  svg {
    path {
      fill: #ffffff;
    }
  }

  padding: var(--ads-v2-spaces-2);
  cursor: pointer;
  border-radius: var(--ads-v2-border-radius);

  &:hover {
    background-color: #ffffff33;
  }
`;

export const ScreenModeToggle = () => {
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

    if ("startViewTransition" in document && isAnimatedIDEEnabled) {
      document.startViewTransition(() => {
        dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
      });
    } else {
      dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
    }
  }, [dispatch, isAnimatedIDEEnabled]);

  const [showNudge, setShowNudge] = useState(true);

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

  if (showNudge) {
    return (
      <Popover open>
        <PopoverTrigger>
          <FocusButton
            className="ml-auto !min-w-[24px]"
            data-testid={"t--ide-minimize"}
            id={"editor-mode-minimize"}
            isIconButton
            kind="tertiary"
            onClick={switchToSplitScreen}
            startIcon={"minimize-v3"}
          />
        </PopoverTrigger>
        <StyledPopoverContent align="center" side="left" size="sm">
          <Flex
            alignItems="flex-start"
            backgroundColor="var(--ads-v2-color-bg-emphasis-max)"
            gap="spaces-2"
          >
            <Text color="#fff" kind="heading-xs">
              Write code and configure UI elements side by side
            </Text>
            <CloseIcon
              name="close-line"
              onClick={() => setShowNudge(false)}
              size="md"
            />
          </Flex>
        </StyledPopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip
      content={createMessage(MINIMIZE_BUTTON_TOOLTIP)}
      key={createMessage(MINIMIZE_BUTTON_TOOLTIP)}
    >
      <Button
        className="ml-auto !min-w-[24px]"
        data-testid={"t--ide-minimize"}
        id={"editor-mode-minimize"}
        isIconButton
        kind="tertiary"
        onClick={switchToSplitScreen}
        startIcon={"minimize-v3"}
      />
    </Tooltip>
  );
};
