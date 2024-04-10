import React from "react";
import { ToggleButton } from "design-system";

import FileTabs from "./FileTabs";
import { useSelector } from "react-redux";
import {
  getIDEViewMode,
  getIsSideBySideEnabled,
  getIsTabsRevampEnabled,
} from "selectors/ideSelectors";
import Container from "./Container";
import { useCurrentEditorState, useIDETabClickHandlers } from "../hooks";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { TabSelectors } from "./constants";
import { includes } from "lodash";
import ListButton from "./ListButton";
import { Announcement } from "../EditorPane/components/Announcement";
import { SearchableFilesList } from "./SearchableFilesList";

const SplitScreenTabs = () => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const isTabsRevampEnabled = useSelector(getIsTabsRevampEnabled);
  const { segment, segmentMode } = useCurrentEditorState();
  const { addClickHandler, closeClickHandler, tabClickHandler } =
    useIDETabClickHandlers();

  const tabsConfig = TabSelectors[segment];

  const files = useSelector(tabsConfig.tabsSelector);
  const allFilesList = useSelector(tabsConfig.listSelector);

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
      onClick={addClickHandler}
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
            navigateToTab={tabClickHandler}
            openTabs={files}
          />
          <FileTabs
            navigateToTab={tabClickHandler}
            onClose={closeClickHandler}
            tabs={files}
          />
          <AddButton />
        </>
      );
    }
    return (
      <>
        <AddButton />
        <FileTabs
          navigateToTab={tabClickHandler}
          onClose={closeClickHandler}
          tabs={files}
        />
        <ListButton items={overflowList} navigateToTab={tabClickHandler} />
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
