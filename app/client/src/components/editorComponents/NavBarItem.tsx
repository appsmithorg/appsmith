import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import AnalyticsUtil from "utils/AnalyticsUtil";

type MenuBarItemProps = {
  icon: Function;
  path: string;
  title: string;
  exact: boolean;
  className?: string;
};

type Props = MenuBarItemProps;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 5px;
  background-color: ${props => props.theme.colors.menuButtonBGInactive};
  border-radius: ${props => props.theme.radii[1]}px;
  height: 32px;
  width: 32px;
  svg path {
    fill: ${props => props.theme.colors.menuIconColorInactive};
  }
`;

const ItemContainer = styled.div`
  && {
    a {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding:${props => props.theme.spaces[5]}px 0;
    color: ${props => props.theme.colors.textOnDarkBG}
    font-size: ${props => props.theme.fontSizes[1]}px;
    cursor: pointer;
    background-color: ${props => props.theme.colors.navBG};
    &:hover {
      background-color: ${props => props.theme.colors.paneBG};
      text-decoration: none;
    }
    color: ${props => props.theme.colors.menuButtonBGInactive};
    &.active {
      background-color: ${props => props.theme.colors.paneBG}
      color: ${props => props.theme.colors.textOnDarkBG};
      ${IconContainer} {
        background-color: ${props => props.theme.colors.primary};
        svg path {
          fill: ${props => props.theme.colors.textOnDarkBG};
        }
      }
    }
  }
}
`;

class NavBarItem extends React.Component<Props> {
  render(): React.ReactNode {
    const { title, icon, path, exact } = this.props;
    return (
      <ItemContainer>
        <NavLink
          exact={exact}
          to={path}
          className={this.props.className}
          onClick={() => {
            AnalyticsUtil.logEvent("SIDEBAR_NAVIGATION", {
              navPage: this.props.title.toUpperCase(),
            });
          }}
        >
          <React.Fragment>
            <IconContainer>{icon({ width: 24, height: 24 })}</IconContainer>
            {title}
          </React.Fragment>
        </NavLink>
      </ItemContainer>
    );
  }
}

export default NavBarItem;
