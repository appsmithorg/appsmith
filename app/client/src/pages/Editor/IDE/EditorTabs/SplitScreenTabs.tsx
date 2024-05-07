import React from "react";
import { Flex, Spinner, ToggleButton } from "design-system";

import FileTabs from "./FileTabs";
import { useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import Container from "./Container";
import { useCurrentEditorState, useIDETabClickHandlers } from "../hooks";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { useIsJSAddLoading } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import { TabSelectors } from "./constants";
import { Announcement } from "../EditorPane/components/Announcement";
import { SearchableFilesList } from "./SearchableFilesList";

const SplitScreenTabs = () => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment, segmentMode } = useCurrentEditorState();
  const { addClickHandler, closeClickHandler, tabClickHandler } =
    useIDETabClickHandlers();
  const isJSLoading = useIsJSAddLoading();

  const tabsConfig = TabSelectors[segment];

  const files = useSelector(tabsConfig.tabsSelector);
  const allFilesList = useSelector(tabsConfig.listSelector);

  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.FullScreen) return null;
  if (segment === EditorEntityTab.UI) return null;

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

  return (
    <>
      {files.length > 0 ? (
        <Container>
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
        </Container>
      ) : null}
      <Announcement />
    </>
  );
};

export default SplitScreenTabs;
