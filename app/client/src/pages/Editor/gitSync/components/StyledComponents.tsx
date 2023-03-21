import styled from "styled-components";
import { getTypographyByKey } from "design-system-old";
import { Colors } from "constants/Colors";

export const Title = styled.p`
  ${getTypographyByKey("h1")};
  margin: ${(props) =>
    `${props.theme.spaces[7]}px 0px ${props.theme.spaces[3]}px 0px`};
  color: ${Colors.GREY_900};
`;

export const Subtitle = styled.div`
  margin-top: 4px;
  ${getTypographyByKey("p1")};
  color: ${Colors.GREY_900};
`;

export const Caption = styled.span`
  ${getTypographyByKey("p1")};
`;

type sizeType =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

export const Space = styled.div<{ size: sizeType; horizontal?: boolean }>`
  margin: ${(props) =>
    props.horizontal
      ? `0px ${props.theme.spaces[props.size]}px `
      : `${props.theme.spaces[props.size]}px 0px`};
`;
