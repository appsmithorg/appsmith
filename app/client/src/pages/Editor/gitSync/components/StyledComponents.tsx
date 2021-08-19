import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";

export const Title = styled.h1`
  ${(props) => getTypographyByKey(props, "h1")};
`;

export const Subtitle = styled.p`
  ${(props) => getTypographyByKey(props, "p3")};
`;

export const Space = styled.div<{ size: number; horizontal?: boolean }>`
  margin: ${(props) =>
    props.horizontal
      ? `0px ${props.theme.spaces[props.size]}px `
      : `${props.theme.spaces[props.size]}px 0px`};
`;
