import styled from "styled-components";

export const PageViewContainer = styled.div<{
  hasPinnedSidebar: boolean;
  sidebarWidth: number;
  isPreviewMode?: boolean;
  isPublished: boolean;
}>`
  ${({ isPublished }) => (isPublished ? "" : "width: inherit;")};
  ${({ hasPinnedSidebar, sidebarWidth }) =>
    hasPinnedSidebar ? `margin-left: ${sidebarWidth}px;` : ""};
  ${({ isPreviewMode }) => (isPreviewMode ? "width: 100%" : "")};
`;

export const PageView = styled.div<{ width: number }>`
  height: 100%;
  position: relative;
  width: ${(props) => props.width}px;
  margin: 0 auto;
`;
