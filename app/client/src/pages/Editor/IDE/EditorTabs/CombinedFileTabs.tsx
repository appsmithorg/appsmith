import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Flex, Spinner, ToggleButton, Tooltip } from "design-system";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { setIdeEditorViewMode } from "actions/ideActions";
import FileTabs from "./FileTabs";
import Container from "./Container";
import { useCurrentEditorState, useIDETabClickHandlers } from "../hooks";
import { TabSelectors } from "./constants";
import {
  MINIMIZE_BUTTON_TOOLTIP,
  createMessage,
  MAXIMIZE_BUTTON_TOOLTIP,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { useIsJSAddLoading } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import { SearchableFilesList } from "./SearchableFilesList";
import { Announcement } from "../EditorPane/components/Announcement";

export const CombinedFileTabs = () => {
  const dispatch = useDispatch();
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment, segmentMode } = useCurrentEditorState();
  const { addClickHandler, closeClickHandler, tabClickHandler } =
    useIDETabClickHandlers();
  const isJSLoading = useIsJSAddLoading();
  const setSplitScreenMode = useCallback(() => {
    dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.SplitScreen,
    });
  }, []);

  const setFullScreenMode = useCallback(() => {
    dispatch(setIdeEditorViewMode(EditorViewMode.FullScreen));
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.FullScreen,
    });
  }, []);

  const tabsConfig = TabSelectors[segment];

  const files = useSelector(tabsConfig.tabsSelector);
  const allFilesList = useSelector(tabsConfig.listSelector);

  const AddButton = () => {
    if (isJSLoading) {
      return (
        <Flex px="spaces-2">
          <Spinner size="md" />
        </Flex>
      );
    }
    return (
      <ToggleButton
        data-testid="t--ide-split-screen-add-button"
        icon="add-line"
        id="tabs-add-toggle"
        isSelected={segmentMode === EditorEntityTabState.Add}
        onClick={addClickHandler}
        size="md"
      />
    );
  };

  if (!isSideBySideEnabled) return null;
  if (segment === EditorEntityTab.UI) return null;
  return (
    <Container>
      {ideViewMode === EditorViewMode.SplitScreen && (
        <SearchableFilesList
          allItems={allFilesList}
          navigateToTab={tabClickHandler}
          openTabs={files}
        />
      )}
      <Flex alignItems="center" flex={1} gap="spaces-2">
        <FileTabs
          navigateToTab={tabClickHandler}
          onClose={closeClickHandler}
          tabs={files}
        />
        <AddButton />
      </Flex>
      {ideViewMode === EditorViewMode.SplitScreen ? (
        <Tooltip content={createMessage(MAXIMIZE_BUTTON_TOOLTIP)}>
          <Button
            data-testid="t--ide-maximize"
            id="editor-mode-maximize"
            isIconButton
            kind="tertiary"
            onClick={setFullScreenMode}
            startIcon="maximize-v3"
          />
        </Tooltip>
      ) : (
        <Tooltip
          content={createMessage(MINIMIZE_BUTTON_TOOLTIP)}
          placement="bottomRight"
        >
          <Button
            className="ml-auto"
            data-testid="t--ide-minimize"
            id="editor-mode-minimize"
            isIconButton
            kind="tertiary"
            onClick={setSplitScreenMode}
            startIcon="minimize-v3"
          />
        </Tooltip>
      )}

      <Announcement />
    </Container>
  );
};
