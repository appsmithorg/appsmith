import styled from "styled-components";

export const StyledPill = styled.div`
  margin: 4px 12px;
  padding: 4px;
  display: inline-block;
  cursor: pointer;
  border: thin solid var(--appsmith-color-black-100);
  &:hover {
    background-color: var(--appsmith-color-black-50);
  }
`;

export const StyledPillLabel = styled.div`
  margin-right: 8px;
  display: inline-block;

  & .pill-key {
    margin-left: 4px;
  }
`;

export const StyledPillValue = styled.div`
  display: inline-block;
  border-bottom: thin dotted var(--appsmith-color-black-400);
  color: var(--appsmith-color-orange-500);
`;
