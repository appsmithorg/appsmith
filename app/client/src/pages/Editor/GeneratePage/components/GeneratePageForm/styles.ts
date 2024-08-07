import styled from "styled-components";
import { getTypographyByKey } from "@appsmith/ads-old";

export const SelectWrapper = styled.div<{ width: string }>`
  display: inline-block;
  margin: 8px 0;
  max-width: ${(props) => props.width};
  width: 100%;
  &:first-child {
    margin-top: 16px;
  }
`;

export const Label = styled.p`
  flex: 1;
  ${getTypographyByKey("p1")};
  white-space: nowrap;
  display: flex;
  align-items: center;
  margin-bottom: 4px;
`;

export const Bold = styled.span`
  font-weight: 500;
  /* margin-left: 2px; */
`;
