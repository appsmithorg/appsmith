import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";

export const SelectWrapper = styled.div<{ width: string }>`
  margin: 10px;
  max-width: ${(props) => props.width};
`;

export const Label = styled.p`
  flex: 1;
  ${(props) => `${getTypographyByKey(props, "p1")}`}
`;

export const Bold = styled.span`
  font-weight: 500;
`;
