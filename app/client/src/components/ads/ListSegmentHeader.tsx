import React, { CSSProperties } from "react";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";

const StyledSegmentHeader = styled.div`
  padding: ${(props) =>
    `${props.theme.spaces[3]}px ${props.theme.spaces[5]}px`};
  padding-right: 0;
  ${(props) => getTypographyByKey(props, "u2")}
  color: ${Colors.GREY_10};
  display: flex;
  align-items: center;
`;

const StyledHr = styled.div`
  flex: 1;
  height: 1px;
  background-color: ${Colors.GREY_10};
  margin-left: ${(props) => props.theme.spaces[3]}px;
`;

export type SegmentHeaderProps = {
  title: string;
  style?: CSSProperties;
  hideStyledHr?: boolean;
};

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
