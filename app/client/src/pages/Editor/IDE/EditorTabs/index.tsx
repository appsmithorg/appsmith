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
import FileTabs from "./FileTabs";
import Container from "./Container";
import { useCurrentEditorState, useIDETabClickHandlers } from "../hooks";
import { TabSelectors } from "./constants";
import { AddButton } from "./AddButton";
import { Announcement } from "../EditorPane/components/Announcement";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { List } from "./List";
import { ScreenModeToggle } from "./ScreenModeToggle";
import { AddTab } from "./AddTab";

const EditorTabs = () => {
  const [showListView, setShowListView] = useState(false);
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment, segmentMode } = useCurrentEditorState();
  const { closeClickHandler, tabClickHandler } = useIDETabClickHandlers();
  const tabsConfig = TabSelectors[segment];
  const files = useSelector(tabsConfig.tabsSelector, shallowEqual);

  const location = useLocation();
  const currentEntity = identifyEntityFromPath(location.pathname);

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
    const activetab = document.querySelector(".editor-tab.active");
    if (activetab) {
      activetab.scrollIntoView({
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

  if (!isSideBySideEnabled) return null;
  if (segment === EditorEntityTab.UI) return null;

  const handleHamburgerClick = () => {
    if (files.length === 0 && segmentMode !== EditorEntityTabState.Add) return;
    setShowListView(!showListView);
  };

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
          options={{
            overflow: {
              x: "scroll",
              y: "hidden",
            },
          }}
          size={"sm"}
        >
          <Flex
            className="items-center"
            data-testid="t--tabs-container"
            gap="spaces-2"
            height="100%"
          >
            <FileTabs
              currentEntity={currentEntity}
              isListActive={showListView}
              navigateToTab={onTabClick}
              onClose={closeClickHandler}
              tabs={files}
            />
            <AddTab
              isListActive={showListView}
              newTabClickCallback={newTabClickHandler}
              onClose={closeClickHandler}
            />
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
