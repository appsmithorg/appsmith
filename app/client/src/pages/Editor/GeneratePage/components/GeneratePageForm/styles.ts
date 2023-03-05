import styled from "styled-components";
import { getTypographyByKey } from "design-system-old";

export const SelectWrapper = styled.div<{ width: string }>`
  display: inline-block;
  margin: 10px;
  max-width: ${(props) => props.width};
  width: 100%;
`;

export const Label = styled.p`
  flex: 1;
  ${getTypographyByKey("p1")};
  white-space: nowrap;
`;

export const Bold = styled.span`
  font-weight: 500;
`;
