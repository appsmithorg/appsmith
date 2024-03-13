import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Tooltip } from "design-system";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import type { EntityItem } from "@appsmith/entities/IDE/constants";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { setIdeEditorViewMode } from "actions/ideActions";
import FileTabs from "./FileTabs";
import Container from "./Container";
import { useCurrentEditorState } from "../hooks";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import history, { NavigationMethod } from "utils/history";
import { TabSelectors } from "./constants";
import {
  MINIMIZE_BUTTON_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";

const FullScreenTabs = () => {
  const dispatch = useDispatch();
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const setSplitScreenMode = useCallback(() => {
    dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.SplitScreen,
    });
  }, []);
  const tabsConfig = TabSelectors[segment];
  const pageId = useSelector(getCurrentPageId);

  const files = useSelector(tabsConfig.tabsSelector);

  const onClick = useCallback(
    (item: EntityItem) => {
      const navigateToUrl = tabsConfig.itemUrlSelector(item, pageId);
      history.push(navigateToUrl, {
        invokedBy: NavigationMethod.EditorTabs,
      });
    },
    [segment],
  );

  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.SplitScreen) return null;
  if (segment === EditorEntityTab.UI) return null;
  return (
    <Container>
      <FileTabs navigateToTab={onClick} tabs={files} />
      <Tooltip
        content={createMessage(MINIMIZE_BUTTON_TOOLTIP)}
        placement="bottomRight"
      >
        <Button
          id="editor-mode-minimize"
          isIconButton
          kind="tertiary"
          onClick={setSplitScreenMode}
          startIcon="minimize-v3"
        />
      </Tooltip>
    </Container>
  );
};

export default FullScreenTabs;
