import React from "react";
import styled from "styled-components";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "../../../SegmentedControl";
import { Flex } from "../../../Flex";

interface Props {
  selectedSegment: string;
  onSegmentChange: (value: string) => void;
  options: SegmentedControlOption[];
  children?: React.ReactNode | React.ReactNode[];
}

const Container = styled(Flex)`
  #editor-pane-segment-control {
    max-width: 247px;
  }
`;

export const EditorSegments = (props: Props) => {
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
        id="editor-pane-segment-control"
        onChange={onSegmentChange}
        options={options}
        value={selectedSegment}
      />
      {children}
    </Container>
  );
};
