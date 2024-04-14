import React, { useCallback } from "react";
import { Flex, Spinner, ToggleButton } from "design-system";

import FileTabs from "./FileTabs";
import { useSelector } from "react-redux";
import {
  getIDEViewMode,
  getIsSideBySideEnabled,
  getIsTabsRevampEnabled,
} from "selectors/ideSelectors";
import Container from "./Container";
import { useCurrentEditorState } from "../hooks";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import {
  useIsJSAddLoading,
  useJSAdd,
} from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import { useQueryAdd } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import { TabSelectors } from "./constants";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import history, { NavigationMethod } from "utils/history";
import { includes } from "lodash";
import ListButton from "./ListButton";
import { Announcement } from "../EditorPane/components/Announcement";
import { SearchableFilesList } from "./SearchableFilesList";

const SplitScreenTabs = () => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const isTabsRevampEnabled = useSelector(getIsTabsRevampEnabled);
  const { segment, segmentMode } = useCurrentEditorState();

  const onJSAddClick = useJSAdd();
  const isJSLoading = useIsJSAddLoading();
  const onQueryAddClick = useQueryAdd();
  const onAddClick = useCallback(() => {
    if (segment === EditorEntityTab.JS) onJSAddClick();
    if (segment === EditorEntityTab.QUERIES) onQueryAddClick();
  }, [segment, segmentMode, onQueryAddClick, onJSAddClick]);

  const tabsConfig = TabSelectors[segment];
  const pageId = useSelector(getCurrentPageId);

  const files = useSelector(tabsConfig.tabsSelector);
  const allFilesList = useSelector(tabsConfig.listSelector);

  const onClick = useCallback(
    (item: EntityItem) => {
      const navigateToUrl = tabsConfig.itemUrlSelector(item, pageId);
      history.push(navigateToUrl, {
        invokedBy: NavigationMethod.EditorTabs,
      });
    },
    [segment, pageId],
  );

  const overflowList = allFilesList.filter((item) => !includes(files, item));

  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.FullScreen) return null;
  if (segment === EditorEntityTab.UI) return null;

  const AddButton = () => (
    <ToggleButton
      data-testid="t--ide-split-screen-add-button"
      icon="add-line"
      id="tabs-add-toggle"
      isSelected={segmentMode === EditorEntityTabState.Add}
      onClick={onAddClick}
      size="md"
    />
  );

  // TODO: Remove this once release_ide_tabs_revamp_enabled is lifted
  const Content = () => {
    if (isTabsRevampEnabled) {
      return (
        <>
          <SearchableFilesList
            allItems={allFilesList}
            navigateToTab={onClick}
            openTabs={files}
          />
          <FileTabs navigateToTab={onClick} tabs={files} />
          <AddButton />
        </>
      );
    }
    return (
      <>
        {isJSLoading ? (
          <Flex px="spaces-2">
            <Spinner size="md" />
          </Flex>
        ) : (
          <AddButton />
        )}
        <FileTabs navigateToTab={onClick} tabs={files} />
        <ListButton items={overflowList} navigateToTab={onClick} />
      </>
    );
  };

  return (
    <>
      {files.length > 0 ? (
        <Container>
          <Content />
        </Container>
      ) : null}
      <Announcement />
    </>
  );
};

export default SplitScreenTabs;
