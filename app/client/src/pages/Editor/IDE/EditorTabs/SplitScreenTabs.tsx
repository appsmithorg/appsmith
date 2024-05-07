import React from "react";

import FileTabs from "./FileTabs";
import { useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import Container from "./Container";
import { useCurrentEditorState, useIDETabClickHandlers } from "../hooks";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { TabSelectors } from "./constants";
import { Announcement } from "../EditorPane/components/Announcement";
import { SearchableFilesList } from "./SearchableFilesList";
import { AddButton } from "./AddButton";

const SplitScreenTabs = () => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const { closeClickHandler, tabClickHandler } = useIDETabClickHandlers();

  const tabsConfig = TabSelectors[segment];

  const files = useSelector(tabsConfig.tabsSelector);
  const allFilesList = useSelector(tabsConfig.listSelector);

  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.FullScreen) return null;
  if (segment === EditorEntityTab.UI) return null;

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
