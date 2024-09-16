import React from "react";
import { Button, Flex, SegmentedControl } from "@appsmith/ads";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { EditorEntityTab } from "ee/entities/IDE/constants";
import history from "utils/history";
import { globalAddURL } from "ee/RouteBuilder";
import { useSelector } from "react-redux";
import { useCurrentEditorState, useSegmentNavigation } from "../../hooks";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { getCurrentBasePageId } from "selectors/editorSelectors";

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
  const isGlobalAddPaneEnabled = useFeatureFlag(
    FEATURE_FLAG.release_global_add_pane_enabled,
  );
  const basePageId = useSelector(getCurrentBasePageId);
  const onAddButtonClick = () => {
    history.push(globalAddURL({ basePageId }));
  };
  const { segment } = useCurrentEditorState();
  const { onSegmentChange } = useSegmentNavigation();

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
    </Container>
  );
};

export default SegmentedHeader;
