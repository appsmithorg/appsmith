import React, { useEffect, useState } from "react";
import { shallowEqual, useSelector } from "react-redux";
import { Flex, ScrollArea, ToggleButton } from "@appsmith/ads";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import type { EntityItem } from "ee/entities/IDE/constants";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "ee/entities/IDE/constants";

import Container from "./Container";
import { useCurrentEditorState, useIDETabClickHandlers } from "../hooks";
import { SCROLL_AREA_OPTIONS, TabSelectors } from "./constants";
import { AddButton } from "./AddButton";
import { Announcement } from "../EditorPane/components/Announcement";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { List } from "./List";
import { ScreenModeToggle } from "./ScreenModeToggle";

import { FileTab } from "IDE/Components/FileTab";
import { useEventCallback } from "usehooks-ts";

import { saveActionName } from "actions/pluginActionActions";
import { saveJSObjectName } from "actions/jsActionActions";
import { useNameEditor } from "utils/hooks/useNameEditor";

import {
  getJsObjectNameSavingStatuses,
  getApiNameSavingStatuses,
} from "selectors/ui";

const EditorTabs = () => {
  const [showListView, setShowListView] = useState(true);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment, segmentMode } = useCurrentEditorState();
  const { closeClickHandler, tabClickHandler } = useIDETabClickHandlers();
  const tabsConfig = TabSelectors[segment];
  const files = useSelector(tabsConfig.tabsSelector, shallowEqual);

  const saveStatus = useSelector(
    EditorEntityTab.JS === segment
      ? getJsObjectNameSavingStatuses
      : getApiNameSavingStatuses,
    shallowEqual,
  );

  const location = useLocation();
  const currentEntity = identifyEntityFromPath(location.pathname);

  const { handleNameSave, normalizeName, validateName } = useNameEditor({
    nameSaveAction:
      EditorEntityTab.JS === segment ? saveJSObjectName : saveActionName,
  });

  // Turn off list view while changing segment, files
  useEffect(() => {
    setShowListView(false);
  }, [currentEntity.id, currentEntity.entity, files, segmentMode]);

  // Show list view if all tabs is closed
  useEffect(() => {
    if (files.length === 0 && segmentMode !== EditorEntityTabState.Add) {
      setShowListView(true);
    }
  }, [files, segmentMode, currentEntity.entity]);

  // scroll to the active tab
  useEffect(() => {
    const activeTab = document.querySelector(".editor-tab.active");
    if (activeTab) {
      activeTab.scrollIntoView({
        inline: "nearest",
      });
    }
  }, [files, segmentMode]);

  // show border if add button is sticky
  useEffect(() => {
    const ele = document.querySelector<HTMLElement>(
      '[data-testid="t--editor-tabs"] > [data-overlayscrollbars-viewport]',
    );
    if (ele && ele.scrollWidth > ele.clientWidth) {
      ele.style.borderRight = "1px solid var(--ads-v2-color-border)";
    } else if (ele) {
      ele.style.borderRight = "unset";
    }
  }, [files]);

  const handleHamburgerClick = useEventCallback(() => {
    if (files.length === 0 && segmentMode !== EditorEntityTabState.Add) return;
    setShowListView(!showListView);
  });

  const handleTabClick = (tab: EntityItem) => {
    setShowListView(false);
    tabClickHandler(tab);
  };

  const createTabEditorConfig = (title: string, key: string) => ({
    onTitleSave: handleNameSave(title, key),
    validateTitle: validateName(title),
    titleTransformer: normalizeName,
  });

  if (!isSideBySideEnabled) return null;
  if (segment === EditorEntityTab.UI) return null;

  return (
    <>
      <Container>
        {ideViewMode === EditorViewMode.SplitScreen && files.length > 0 ? (
          <ToggleButton
            data-testid="t--list-toggle"
            icon="hamburger"
            isSelected={showListView}
            onClick={handleHamburgerClick}
            size="md"
          />
        ) : null}
        <ScrollArea
          className="h-[32px] top-[0.5px]"
          data-testid="t--editor-tabs"
          options={SCROLL_AREA_OPTIONS}
          size="sm"
        >
          <Flex
            className="items-center"
            data-testid="t--tabs-container"
            gap="spaces-2"
            height="100%"
          >
            {files.map((tab) => (
              <FileTab
                editorConfig={createTabEditorConfig(tab.title, tab.key)}
                icon={tab.icon}
                isActive={
                  currentEntity.id === tab.key &&
                  segmentMode !== EditorEntityTabState.Add &&
                  !showListView
                }
                isLoading={saveStatus[tab.key]}
                key={tab.key}
                onClick={() => handleTabClick(tab)}
                onClose={() => closeClickHandler(tab.key)}
                title={tab.title}
              />
            ))}
          </Flex>
        </ScrollArea>
        {files.length > 0 ? <AddButton /> : null}
        {/* Switch screen mode button */}
        <ScreenModeToggle />
      </Container>

      {/* Overflow list */}
      {showListView && ideViewMode === EditorViewMode.SplitScreen && <List />}

      {/* Announcement modal */}
      {ideViewMode === EditorViewMode.SplitScreen && <Announcement />}
    </>
  );
};

export default EditorTabs;
