import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";

export const SelectWrapper = styled.div<{ width: string }>`
  display: inline-block;
  margin: 10px;
  max-width: ${(props) => props.width};
  width: 100%;
`;

export const Label = styled.p`
  flex: 1;
  ${(props) => `${getTypographyByKey(props, "p1")}`};
  white-space: nowrap;
`;

export const Bold = styled.span`
  font-weight: 500;
`;
