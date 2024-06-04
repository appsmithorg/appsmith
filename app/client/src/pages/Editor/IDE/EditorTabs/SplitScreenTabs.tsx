import React, { useCallback } from "react";

import FileTabs from "./FileTabs";
import { useDispatch, useSelector } from "react-redux";
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
import { Button, Tooltip } from "design-system";
import {
  MAXIMIZE_BUTTON_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { setIdeEditorViewMode } from "actions/ideActions";

const SplitScreenTabs = () => {
  const dispatch = useDispatch();
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const { closeClickHandler, tabClickHandler } = useIDETabClickHandlers();

  const tabsConfig = TabSelectors[segment];

  const files = useSelector(tabsConfig.tabsSelector);
  const allFilesList = useSelector(tabsConfig.listSelector);

  const handleMaximizeButtonClick = useCallback(() => {
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.FullScreen,
    });
    dispatch(setIdeEditorViewMode(EditorViewMode.FullScreen));
  }, []);

  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.FullScreen) return null;
  if (segment === EditorEntityTab.UI) return null;

  return (
    <>
      {/* {files.length > 0 ? ( */}
      <Container>
        <SearchableFilesList
          allItems={allFilesList}
          navigateToTab={tabClickHandler}
        />
        <FileTabs
          navigateToTab={tabClickHandler}
          onClose={closeClickHandler}
          tabs={files}
        />
        {files.length > 0 ? <AddButton /> : null}

        <Tooltip content={createMessage(MAXIMIZE_BUTTON_TOOLTIP)}>
          <Button
            className="ml-auto !min-w-[24px]"
            data-testid="t--ide-maximize"
            id="editor-mode-maximize"
            isIconButton
            kind="tertiary"
            onClick={handleMaximizeButtonClick}
            startIcon="maximize-v3"
          />
        </Tooltip>
      </Container>
      <Announcement />
    </>
  );
};

export default SplitScreenTabs;
