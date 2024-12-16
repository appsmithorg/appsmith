import React from "react";
import { SegmentedControl } from "../../../SegmentedControl";
import { Container } from "./EditorSegments.styles";
import type { EditorSegmentsProps } from "./EditorSegments.types";

export const EditorSegments = (props: EditorSegmentsProps) => {
  const { children, onSegmentChange, options, selectedSegment } = props;

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
        className="editor-pane-segment-control"
        onChange={onSegmentChange}
        options={options}
        value={selectedSegment}
      />
      {children}
    </Container>
  );
};
