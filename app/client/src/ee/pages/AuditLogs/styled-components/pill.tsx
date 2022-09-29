import styled from "styled-components";

export const StyledPill = styled.div`
  margin: 4px 12px;
  padding: 4px;
  display: inline-block;
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
  cursor: pointer;
  color: var(--appsmith-color-orange-500);
`;
