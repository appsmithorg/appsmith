import { Icon } from "../Icon";
import styled from "styled-components";

export const StyledCollapsibleContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: max-content;
  gap: var(--ads-v2-spaces-2);
`;

export const StyledCollapsibleHeader = styled.div`
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-2);
  padding: var(--ads-v2-spaces-2) var(--ads-v2-spaces-0);
  color: var(--ads-v2-colors-content-label-default-fg);
`;

export const StyledCollapsibleContent = styled.div<{ isExpanded: boolean }>`
  display: ${(props) => (props.isExpanded ? "flex" : "none")};
  overflow: hidden;
  flex-direction: column;
`;

export const StyledEndIcon = styled(Icon)`
  margin-left: auto;
`;
