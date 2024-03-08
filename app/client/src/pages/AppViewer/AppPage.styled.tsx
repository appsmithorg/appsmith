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
  ${({ hasPinnedSidebar, isPreview, sidebarWidth }) =>
    (hasPinnedSidebar && !isPreview && `margin-left: ${sidebarWidth}px;`) ||
    (hasPinnedSidebar &&
      isPreview &&
      `padding-left: ${sidebarWidth}px; margin: 0 auto;`) ||
    "margin: 0 auto;"}
`;

export const PageView = styled.div<{ width: string }>`
  height: 100%;
  position: relative;
  width: ${(props) => props.width};
  margin: 0 auto;
`;
