import styled from "styled-components";

export const CopyContainer = styled.div`
  height: 36px;
  border: 1px solid var(--ads-v2-color-border);
  padding: 8px;
  box-sizing: border-box;
  border-radius: var(--ads-v2-border-radius);
  background-color: #fff;
  align-items: center;
  display: flex;
  margin-bottom: 4px;
  width: 100%;
`;

export const CopyText = styled.span`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  flex: 1;
  color: var(--ads-v2-color-fg);
  margin-right: 8px;
`;
