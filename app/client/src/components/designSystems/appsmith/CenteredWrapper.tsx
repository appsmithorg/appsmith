import styled from "styled-components";

/**
 * Common component, mostly use to show loader / message
 *
 * Used By:
 *    AppViewerPageContainer
 *      - parent component AppViewer -> AppViewerBody's height calculated good enough
 *      - inherited height works fine here.
 *    CanvasContainer
 *      - calculated height looks good
 *    DefaultOrgPage
 *      - calculated height looks good
 */
export default styled.div<{
  isInheritedHeight?: boolean;
}>`
  height: ${(props) =>
    props.isInheritedHeight
      ? "inherit"
      : `calc(100vh - ${props.theme.smallHeaderHeight})`};
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
`;
