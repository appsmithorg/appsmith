import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Flex, ScrollArea, ToggleButton } from "design-system";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
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

const EditorTabs = () => {
  const stickyRef = useRef(null);
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
        {ideViewMode === EditorViewMode.SplitScreen && (
          <ToggleButton
            icon="hamburger"
            isSelected={showListView}
            onClick={handleHamburgerClick}
            size="md"
          />
        )}
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
          <Flex className="items-center" gap="spaces-2" height="100%">
            <FileTabs
              currentTab={activeTab}
              navigateToTab={onTabClick}
              onClose={closeClickHandler}
              tabs={files}
            />
            {files.length > 0 ? (
              <AddButton
                newTabClickCallback={newTabClickHandler}
                onClose={closeClickHandler}
                ref={stickyRef}
              />
            ) : null}
          </Flex>
        </ScrollArea>

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
