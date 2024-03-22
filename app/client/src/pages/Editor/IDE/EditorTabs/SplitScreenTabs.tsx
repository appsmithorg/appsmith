import React, { useCallback } from "react";
import { Button, ToggleButton, Tooltip } from "design-system";

import FileTabs from "./FileTabs";
import { useDispatch, useSelector } from "react-redux";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import Container from "./Container";
import { useCurrentEditorState } from "../hooks";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  EditorEntityTab,
  EditorEntityTabState,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { useJSAdd } from "@appsmith/pages/Editor/IDE/EditorPane/JS/hooks";
import { useQueryAdd } from "@appsmith/pages/Editor/IDE/EditorPane/Query/hooks";
import { TabSelectors } from "./constants";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import history, { NavigationMethod } from "utils/history";
import { includes } from "lodash";
import ListButton from "./ListButton";
import { Announcement } from "../EditorPane/components/Announcement";
import {
  MAXIMIZE_BUTTON_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { setIdeEditorViewMode } from "actions/ideActions";

const SplitScreenTabs = () => {
  const dispatch = useDispatch();
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment, segmentMode } = useCurrentEditorState();

  const onJSAddClick = useJSAdd();
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

  const handleMaximizeButtonClick = useCallback(() => {
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.FullScreen,
    });
    dispatch(setIdeEditorViewMode(EditorViewMode.FullScreen));
  }, []);

  const overflowList = allFilesList.filter((item) => !includes(files, item));

  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.FullScreen) return null;
  if (segment === EditorEntityTab.UI) return null;
  return (
    <>
      {files.length > 0 ? (
        <Container>
          <ToggleButton
            data-testid="t--ide-split-screen-add-button"
            icon="add-line"
            id="tabs-add-toggle"
            isSelected={segmentMode === EditorEntityTabState.Add}
            onClick={onAddClick}
            size="md"
          />
          <FileTabs navigateToTab={onClick} tabs={files} />
          <ListButton items={overflowList} navigateToTab={onClick} />
          <Tooltip content={createMessage(MAXIMIZE_BUTTON_TOOLTIP)}>
            <Button
              className="ml-auto"
              data-testid="t--ide-maximize"
              id="editor-mode-maximize"
              isIconButton
              kind="tertiary"
              onClick={handleMaximizeButtonClick}
              startIcon="maximize-v3"
            />
          </Tooltip>
        </Container>
      ) : null}
      <Announcement />
    </>
  );
};

export default SplitScreenTabs;
