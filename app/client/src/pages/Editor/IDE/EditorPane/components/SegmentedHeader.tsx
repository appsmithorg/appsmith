import React, { useCallback } from "react";
import { Button, Flex, SegmentedControl, Tooltip } from "design-system";
import {
  createMessage,
  EDITOR_PANE_TEXTS,
  MAXIMIZE_BUTTON_TOOLTIP,
} from "@appsmith/constants/messages";
import {
  EditorEntityTab,
  EditorViewMode,
} from "@appsmith/entities/IDE/constants";
import history from "utils/history";
import { globalAddURL } from "@appsmith/RouteBuilder";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentPageId } from "@appsmith/selectors/entitiesSelector";
import { useCurrentEditorState, useSegmentNavigation } from "../../hooks";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import AnalyticsUtil from "@appsmith/utils/AnalyticsUtil";
import { setIdeEditorViewMode } from "actions/ideActions";

const Container = styled(Flex)`
  #editor-pane-segment-control {
    max-width: 247px;
  }

  button {
    flex-shrink: 0;
    flex-basis: auto;
  }
`;

const SegmentedHeader = () => {
  const dispatch = useDispatch();
  const isGlobalAddPaneEnabled = useFeatureFlag(
    FEATURE_FLAG.release_global_add_pane_enabled,
  );
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);
  const pageId = useSelector(getCurrentPageId);
  const onAddButtonClick = () => {
    history.push(globalAddURL({ pageId }));
  };
  const { segment } = useCurrentEditorState();
  const { onSegmentChange } = useSegmentNavigation();

  const handleMaximizeButtonClick = useCallback(() => {
    AnalyticsUtil.logEvent("EDITOR_MODE_CHANGE", {
      to: EditorViewMode.FullScreen,
    });
    dispatch(setIdeEditorViewMode(EditorViewMode.FullScreen));
  }, []);

  return (
    <Container
      alignItems="center"
      backgroundColor="var(--ads-v2-colors-control-track-default-bg)"
      className="ide-editor-left-pane__header"
      gap="spaces-2"
      justifyContent="space-between"
      padding="spaces-2"
    >
      <SegmentedControl
        id="editor-pane-segment-control"
        onChange={onSegmentChange}
        options={[
          {
            label: createMessage(EDITOR_PANE_TEXTS.queries_tab),
            value: EditorEntityTab.QUERIES,
          },
          {
            label: createMessage(EDITOR_PANE_TEXTS.js_tab),
            value: EditorEntityTab.JS,
          },
          {
            label: createMessage(EDITOR_PANE_TEXTS.ui_tab),
            value: EditorEntityTab.UI,
          },
        ]}
        value={segment}
      />
      {isGlobalAddPaneEnabled ? (
        <Button
          className={"t--add-editor-button"}
          isIconButton
          kind="primary"
          onClick={onAddButtonClick}
          size="sm"
          startIcon="add-line"
        />
      ) : null}
      {isSideBySideEnabled &&
      editorMode === EditorViewMode.SplitScreen &&
      segment !== EditorEntityTab.UI ? (
        <Tooltip content={createMessage(MAXIMIZE_BUTTON_TOOLTIP)}>
          <Button
            data-testid="t--ide-maximize"
            id="editor-mode-maximize"
            isIconButton
            kind="tertiary"
            onClick={handleMaximizeButtonClick}
            startIcon="maximize-v3"
          />
        </Tooltip>
      ) : null}
    </Container>
  );
};

export default SegmentedHeader;
