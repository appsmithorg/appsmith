import type { CSSProperties } from "react";
import React from "react";
import styled from "styled-components";
import { typography } from "../constants/typography";

const StyledSegmentHeader = styled.div`
  padding: var(--ads-spaces-3) var(--ads-spaces-5);
  padding-right: 0;
  font-weight: ${typography["u2"].fontWeight};
  font-size: ${typography["u2"].fontSize}px;
  line-height: ${typography["u2"].lineHeight}px;
  letter-spacing: ${typography["u2"].letterSpacing}px;
  color: var(--ads-old-color-gray-10);
  display: flex;
  align-items: center;
`;

const StyledHr = styled.div`
  flex: 1;
  height: 1px;
  background-color: var(--ads-old-color-gray-10);
  margin-left: var(--ads-spaces-3);
`;

export interface SegmentHeaderProps {
  title: string;
  style?: CSSProperties;
  hideStyledHr?: boolean;
}

export default function SegmentHeader(props: SegmentHeaderProps) {
  return (
    <StyledSegmentHeader
      data-testid={"t--styled-segment-header"}
      style={props.style}
    >
      {props.title}
      {!props.hideStyledHr && (
        <StyledHr data-testid={"t--styled-segment-header-hr"} />
      )}
    </StyledSegmentHeader>
  );
}
