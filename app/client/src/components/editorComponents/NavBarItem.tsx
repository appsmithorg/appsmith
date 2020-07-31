import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Colors } from "constants/Colors";

type MenuBarItemProps = {
  icon: Function;
  path: string;
  title: string;
  exact?: boolean;
  width: number;
  height: number;
  external?: boolean;
  className?: string;
  highlight?: boolean;
  onClick?: Function;
  isActive: (currentPath: string, expectedPath: string) => boolean;
};

type Props = MenuBarItemProps;

const IconContainer = styled.div<{
  width: number;
  height: number;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  margin-bottom: 5px;
  background-color: ${props => props.theme.colors.menuButtonBGInactive};
  border-radius: ${props => props.theme.radii[1]}px;
  width: ${props => props.width + 8}px;
  height: ${props => props.width + 8}px;
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
      padding: ${props => props.theme.spaces[5]}px 0;
      color: ${props => props.theme.colors.textOnDarkBG};
      font-size: ${props => props.theme.fontSizes[1]}px;
      cursor: pointer;
      &:hover {
        background: ${Colors.TUNDORA};
        text-decoration: none;
      }
      &.active {
        background: ${Colors.TUNDORA};
        color: ${props => props.theme.colors.textOnDarkBG};
        & > div {
          background-color: ${props => props.theme.colors.primary};
          svg path {
            fill: ${props => props.theme.colors.textOnDarkBG};
          }
        }
      }
    }
    span {
      width: 100%;
      display: inline-block;
      text-align: center;
    }
  }
`;

class NavBarItem extends React.Component<Props> {
  render(): React.ReactNode {
    const {
      title,
      icon,
      path,
      exact,
      width,
      height,
      onClick,
      isActive,
    } = this.props;

    return (
      <ItemContainer>
        <NavLink
          exact={exact}
          to={path}
          isActive={(match, location) => {
            return isActive(path, location.pathname);
          }}
          className={this.props.className}
          onClick={() => {
            onClick && onClick();
            AnalyticsUtil.logEvent("SIDEBAR_NAVIGATION", {
              navPage: this.props.title.toUpperCase(),
            });
          }}
        >
          <IconContainer width={width} height={height}>
            {icon({ width, height })}
          </IconContainer>
          <span>{title}</span>
        </NavLink>
      </ItemContainer>
    );
  }
}

export default NavBarItem;
