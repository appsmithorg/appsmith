import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Tooltip } from "design-system";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import { setIdeEditorViewMode } from "actions/ideActions";
import FileTabs from "./FileTabs";
import Container from "./Container";
import { useCurrentEditorState, useIDETabClickHandlers } from "../hooks";
import { TabSelectors } from "./constants";
import {
  MINIMIZE_BUTTON_TOOLTIP,
  createMessage,
} from "@appsmith/constants/messages";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";

const FullScreenTabs = () => {
  const dispatch = useDispatch();
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const ideViewMode = useSelector(getIDEViewMode);
  const { segment } = useCurrentEditorState();
  const { closeClickHandler, tabClickHandler } = useIDETabClickHandlers();

  const setSplitScreenMode = useCallback(() => {
    dispatch(setIdeEditorViewMode(EditorViewMode.SplitScreen));
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.SplitScreen,
    });
  }, []);
  const tabsConfig = TabSelectors[segment];

  const files = useSelector(tabsConfig.tabsSelector);

  if (!isSideBySideEnabled) return null;
  if (ideViewMode === EditorViewMode.SplitScreen) return null;
  if (segment === EditorEntityTab.UI) return null;
  return (
    <Container>
      <FileTabs
        navigateToTab={tabClickHandler}
        onClose={closeClickHandler}
        tabs={files}
      />
      <Tooltip
        content={createMessage(MINIMIZE_BUTTON_TOOLTIP)}
        placement="bottomRight"
      >
        <Button
          className="ml-auto"
          data-testid="t--ide-minimize"
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
