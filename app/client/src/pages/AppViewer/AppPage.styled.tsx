import styled from "styled-components";

/**
 * OldName: PageViewContainer
 */
export const PageViewWrapper = styled.div<{
  hasPinnedSidebar: boolean;
  sidebarWidth: number;
  isPreview?: boolean;
  isPublished: boolean;
}>`
  ${({ isPublished }) => (isPublished ? "" : "width: inherit;")};
  ${({ hasPinnedSidebar, sidebarWidth }) =>
    hasPinnedSidebar ? `margin-left: ${sidebarWidth}px;` : ""};
  ${({ isPreview }) => (isPreview ? "width: 100%;" : "")};
`;

export const PageView = styled.div<{ width: number }>`
  height: 100%;
  position: relative;
  width: ${(props) => props.width}px;
  margin: 0 auto;
`;
