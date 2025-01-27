import React, { useCallback, useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Flex, ScrollArea, ToggleButton } from "@appsmith/ads";
import { getIDEViewMode, getListViewActiveState } from "selectors/ideSelectors";
import type { EntityItem } from "ee/entities/IDE/constants";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "ee/entities/IDE/constants";

import Container from "./Container";
import {
  useCurrentEditorState,
  useIDETabClickHandlers,
  useShowSideBySideNudge,
} from "../hooks";
import { SCROLL_AREA_OPTIONS, TabSelectors } from "./constants";
import { AddButton } from "./AddButton";
import { useLocation } from "react-router";
import { identifyEntityFromPath } from "navigation/FocusEntity";
import { List } from "./List";
import { ScreenModeToggle } from "./ScreenModeToggle";
import { AddTab } from "./AddTab";
import { setListViewActiveState } from "actions/ideActions";

import { useEventCallback } from "usehooks-ts";

import { EditableTab } from "./EditableTab";

const EditorTabs = () => {
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment, segmentMode } = useCurrentEditorState();
  const { closeClickHandler, tabClickHandler } = useIDETabClickHandlers();
  const tabsConfig = TabSelectors[segment];
  const entities = useSelector(tabsConfig.listSelector, shallowEqual);
  const files = useSelector(tabsConfig.tabsSelector, shallowEqual);
  const isListViewActive = useSelector(getListViewActiveState);
  const [showNudge, dismissNudge] = useShowSideBySideNudge();

  const location = useLocation();
  const dispatch = useDispatch();
  const currentEntity = identifyEntityFromPath(location.pathname);

  // Turn off list view while changing segment, files
  useEffect(() => {
    dispatch(setListViewActiveState(false));
  }, [currentEntity.id, currentEntity.entity, files, segmentMode, dispatch]);

  // Show list view if all tabs is closed
  useEffect(() => {
    if (files.length === 0 && segmentMode !== EditorEntityTabState.Add) {
      dispatch(setListViewActiveState(true));
    }
  }, [files, segmentMode, currentEntity.entity, dispatch]);

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

    dispatch(setListViewActiveState(!isListViewActive));
  });

  // TODO: this returns a new function every time, needs to be recomposed
  const handleTabClick = useCallback(
    (tab: EntityItem) => () => {
      dispatch(setListViewActiveState(false));
      tabClickHandler(tab);
    },
    [dispatch, tabClickHandler],
  );

  const handleNewTabClick = useEventCallback(() => {
    dispatch(setListViewActiveState(false));
  });

  if (segment === EditorEntityTab.UI) return null;

  return (
    <>
      <Container>
        {ideViewMode === EditorViewMode.SplitScreen && files.length > 0 ? (
          <ToggleButton
            data-testid="t--list-toggle"
            icon="hamburger"
            isSelected={isListViewActive}
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
            {files.map((tab) => {
              const entity = entities.find((entity) => entity.key === tab.key);

              return (
                <EditableTab
                  entity={entity}
                  icon={tab.icon}
                  id={tab.key}
                  isActive={
                    currentEntity.id === tab.key &&
                    segmentMode !== EditorEntityTabState.Add &&
                    !isListViewActive
                  }
                  key={tab.key}
                  onClick={handleTabClick(tab)}
                  onClose={closeClickHandler}
                  title={tab.title}
                />
              );
            })}
            <AddTab
              isListActive={isListViewActive}
              newTabClickCallback={handleNewTabClick}
              onClose={closeClickHandler}
            />
          </Flex>
        </ScrollArea>
        {files.length > 0 ? <AddButton /> : null}
        {/* Switch screen mode button */}
        <ScreenModeToggle dismissNudge={dismissNudge} showNudge={showNudge} />
      </Container>

      {/* Overflow list */}
      {isListViewActive && ideViewMode === EditorViewMode.SplitScreen && (
        <List />
      )}
    </>
  );
};

export default EditorTabs;
