import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";

export const Title = styled.h1`
  ${(props) => getTypographyByKey(props, "h1")};
`;

export const Subtitle = styled.p`
  ${(props) => getTypographyByKey(props, "p3")};
`;
