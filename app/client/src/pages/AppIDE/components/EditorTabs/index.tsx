import React, { useCallback, useEffect } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEventCallback } from "usehooks-ts";
import { useLocation } from "react-router";

import {
  EntityTabsHeader,
  EntityListButton,
  EntityTabBar,
} from "@appsmith/ads";

import { getIDEViewMode, getListViewActiveState } from "selectors/ideSelectors";
import type { EntityItem } from "ee/IDE/Interfaces/EntityItem";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "IDE/Interfaces/EditorTypes";
import { useIsJSAddLoading } from "ee/pages/Editor/IDE/EditorPane/JS/hooks";

import { identifyEntityFromPath } from "navigation/FocusEntity";
import { setListViewActiveState } from "actions/ideActions";

import { useIDETabClickHandlers, useShowSideBySideNudge } from "./hooks";
import { useCurrentEditorState } from "../../hooks/useCurrentEditorState";
import { List } from "./List";
import { ScreenModeToggle } from "./ScreenModeToggle";
import { EditableTab } from "./EditableTab";
import { TabSelectors } from "./constants";
import { AddTab } from "./AddTab";

const EditorTabs = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment, segmentMode } = useCurrentEditorState();
  const { closeClickHandler, tabClickHandler } = useIDETabClickHandlers();
  const tabsConfig = TabSelectors[segment];
  const entities = useSelector(tabsConfig.listSelector, shallowEqual);
  const files = useSelector(tabsConfig.tabsSelector, shallowEqual);
  const isListViewActive = useSelector(getListViewActiveState);
  const [showNudge, dismissNudge] = useShowSideBySideNudge();
  const { addClickHandler } = useIDETabClickHandlers();
  const isJSLoading = useIsJSAddLoading();
  const hideAdd = segmentMode === EditorEntityTabState.Add || !files.length;

  const currentEntity = identifyEntityFromPath(location.pathname);
  const showEntityListButton =
    ideViewMode === EditorViewMode.SplitScreen && files.length > 0;

  useEffect(
    function turnOffListViewWhileChangingSegmentFiles() {
      dispatch(setListViewActiveState(false));
    },
    [currentEntity.id, currentEntity.entity, files, segmentMode, dispatch],
  );

  useEffect(
    function showListViewIfAllTabsAreClosed() {
      if (files.length === 0 && segmentMode !== EditorEntityTabState.Add) {
        dispatch(setListViewActiveState(true));
      }
    },
    [files, segmentMode, currentEntity.entity, dispatch],
  );

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
      <EntityTabsHeader>
        {showEntityListButton && (
          <EntityListButton
            data-testid="t--list-toggle"
            isSelected={isListViewActive}
            onClick={handleHamburgerClick}
          />
        )}

        <EntityTabBar
          hideAdd={hideAdd}
          isAddingNewTab={isJSLoading}
          onTabAdd={addClickHandler}
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
        </EntityTabBar>
        <ScreenModeToggle dismissNudge={dismissNudge} showNudge={showNudge} />
      </EntityTabsHeader>

      {isListViewActive && ideViewMode === EditorViewMode.SplitScreen && (
        <List />
      )}
    </>
  );
};

export default EditorTabs;
