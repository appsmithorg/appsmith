import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Flex, ToggleButton, Tooltip } from "design-system";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
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
  MAXIMIZE_BUTTON_TOOLTIP,
  MINIMIZE_BUTTON_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { AddButton } from "./AddButton";
import { Announcement } from "../EditorPane/components/Announcement";
import ListQuery from "../EditorPane/Query/List";
import styled from "styled-components";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";

const ListContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const EditorTabs = () => {
  const dispatch = useDispatch();
  const [showListView, setShowListView] = useState(false);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment, segmentMode } = useCurrentEditorState();
  const { closeClickHandler, tabClickHandler } = useIDETabClickHandlers();

  const tabsConfig = TabSelectors[segment];
  const files = useSelector(tabsConfig.tabsSelector);

  const location = useLocation();
  const currentEntity = identifyEntityFromPath(location.pathname);
  const activeTab = showListView
    ? ""
    : segmentMode === EditorEntityTabState.Add
      ? "add"
      : currentEntity.id;

  useEffect(() => {
    if (files.length === 0 && segmentMode !== EditorEntityTabState.Add) {
      setShowListView(true);
    } else if (showListView) {
      setShowListView(false);
    }
  }, [files, segmentMode]);

  const toggleEditorMode = useCallback(() => {
    const newMode =
      ideViewMode === EditorViewMode.SplitScreen
        ? EditorViewMode.FullScreen
        : EditorViewMode.SplitScreen;

    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: newMode,
    });
    dispatch(setIdeEditorViewMode(newMode));
  }, [ideViewMode, dispatch]);

  const handleHamburgerClick = () => {
    if (files.length === 0 && segmentMode !== EditorEntityTabState.Add) return;
    setShowListView(!showListView);
  };

  if (!isSideBySideEnabled) return null;
  if (segment === EditorEntityTab.UI) return null;

  const onTabClick = (tab: EntityItem) => {
    setShowListView(false);
    tabClickHandler(tab);
  };

  const newTabClickHandler = () => {
    setShowListView(false);
  };

  return (
    <>
      <Container>
        {ideViewMode === EditorViewMode.SplitScreen && (
          <ToggleButton
            icon="hamburger"
            isSelected={showListView}
            onClick={handleHamburgerClick}
            size="md"
          />
        )}
        <FileTabs
          currentTab={activeTab}
          navigateToTab={onTabClick}
          newTabClickCallback={newTabClickHandler}
          onClose={closeClickHandler}
          tabs={files}
        />
        {files.length > 0 ? <AddButton /> : null}
        <Tooltip
          content={
            ideViewMode === EditorViewMode.SplitScreen
              ? createMessage(MAXIMIZE_BUTTON_TOOLTIP)
              : createMessage(MINIMIZE_BUTTON_TOOLTIP)
          }
        >
          <Button
            className="ml-auto !min-w-[24px]"
            data-testid={
              ideViewMode === EditorViewMode.SplitScreen
                ? "t--ide-maximize"
                : "t--ide-minimize"
            }
            id={
              ideViewMode === EditorViewMode.SplitScreen
                ? "editor-mode-maximize"
                : "editor-mode-minimize"
            }
            isIconButton
            kind="tertiary"
            onClick={toggleEditorMode}
            startIcon={
              ideViewMode === EditorViewMode.SplitScreen
                ? "maximize-v3"
                : "minimize-v3"
            }
          />
        </Tooltip>
      </Container>
      {showListView && ideViewMode === EditorViewMode.SplitScreen && (
        <ListContainer
          bg="var(--ads-v2-color-bg)"
          className="absolute top-[78px] albin"
          h="calc(100% - 78px)"
          w="100%"
          zIndex="10"
        >
          <ListQuery />
        </ListContainer>
      )}
      {ideViewMode === EditorViewMode.SplitScreen && <Announcement />}
    </>
  );
};

export default EditorTabs;
