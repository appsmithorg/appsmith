import React from "react";
import { Flex, SegmentedControl } from "@appsmith/ads";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { EditorEntityTab } from "ee/entities/IDE/constants";
import { useCurrentEditorState, useSegmentNavigation } from "../../hooks";
import styled from "styled-components";

const Container = styled(Flex)`
  #editor-pane-segment-control {
    max-width: 247px;
  }
`;

const SegmentedHeader = () => {
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
    </Container>
  );
};

export default SegmentedHeader;
