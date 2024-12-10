import React from "react";
import { Flex, SegmentedControl } from "@appsmith/ads";
import { createMessage, EDITOR_PANE_TEXTS } from "ee/constants/messages";
import { EditorEntityTab } from "ee/entities/IDE/constants";
import { useCurrentEditorState, useSegmentNavigation } from "../../hooks";
import styled from "styled-components";

const Container = styled(Flex)`
  #editor-pane-segment-control {
    max-width: 247px;

    .ads-v2-segmented-control__segments-container[data-selected="false"]:hover {
      background-color: var(--ads-v2-color-bg-muted);
    }

    .ads-v2-segmented-control__segments-container:hover {
      &::after {
        background-color: transparent;
      }
    }
  }
`;

const StyledLabel = styled.span<{ isSelected: boolean }>`
  font-weight: ${(props) => (props.isSelected ? "500" : "normal")};
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
            label: (
              <StyledLabel isSelected={segment === EditorEntityTab.QUERIES}>
                {createMessage(EDITOR_PANE_TEXTS.queries_tab)}
              </StyledLabel>
            ),
            startIcon: "queries-line",
            value: EditorEntityTab.QUERIES,
          },
          {
            label: (
              <StyledLabel isSelected={segment === EditorEntityTab.JS}>
                {createMessage(EDITOR_PANE_TEXTS.js_tab)}
              </StyledLabel>
            ),
            startIcon: "content-type-json",
            value: EditorEntityTab.JS,
          },
          {
            label: (
              <StyledLabel isSelected={segment === EditorEntityTab.UI}>
                {createMessage(EDITOR_PANE_TEXTS.ui_tab)}
              </StyledLabel>
            ),
            startIcon: "dashboard-line",
            value: EditorEntityTab.UI,
          },
        ]}
        value={segment}
      />
    </Container>
  );
};

export default SegmentedHeader;
