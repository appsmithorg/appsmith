import styled from "styled-components";
import { getTypographyByKey } from "@appsmith/ads-old";

export const Title = styled.p`
  ${getTypographyByKey("h2")};
  /* margin: ${(props) =>
    `${props.theme.spaces[7]}px 0px ${props.theme.spaces[3]}px 0px`}; */
  color: var(--ads-v2-color-fg-emphasis);
`;

export const Subtitle = styled.div`
  margin-top: 8px;
  ${getTypographyByKey("p1")};
  color: var(--ads-v2-color-fg);
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
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  scrollbar-width: none;

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
  }

  &::-webkit-scrollbar {
    width: 0;
  }
`;
