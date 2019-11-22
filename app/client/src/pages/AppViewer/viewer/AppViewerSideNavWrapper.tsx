import styled from "styled-components";
export default styled.div`
  background: ${props => props.theme.colors.paneBG};
  & button.sidenav-toggle,
  & button.sidenav-toggle:hover,
  & button.sidenav-toggle:active {
    background: ${props => props.theme.colors.paneBG};
    outline: none;
    border: none;
    border-radius: 0;
  }
  & ul {
    background: ${props => props.theme.colors.paneBG};
    color: ${props => props.theme.colors.textOnDarkBG};
    padding: 0;
    height: 100%;
    width: 100%;
    & li {
      padding: 0;
    }
    & li div.bp3-menu-item {
      width: 100%;
      font-size: ${props => props.theme.fontSizes[3]}px;
      &.bp3-intent-primary {
        background: ${props => props.theme.sideNav.activeItemBGColor};
      }
      & div {
        line-height: ${props => props.theme.lineHeights[6]}px;
      }
    }
  }
`;
