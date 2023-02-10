import styled from "styled-components";

export const PageViewContainer = styled.div<{
  hasPinnedSidebar: boolean;
  sidebarWidth: number;
}>`
  ${({ hasPinnedSidebar, sidebarWidth }) =>
    hasPinnedSidebar ? `margin-left: ${sidebarWidth}px;` : ""};
`;

export const PageView = styled.div<{ width: number }>`
  height: 100%;
  position: relative;
  width: ${(props) => props.width}px;
  margin: 0 auto;
`;
