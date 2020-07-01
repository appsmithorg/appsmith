import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import AnalyticsUtil from "utils/AnalyticsUtil";
import NotificationIcon from "components/designSystems/appsmith/NotificationIcon";
import { theme } from "constants/DefaultTheme";

type MenuBarItemProps = {
  icon: Function;
  path: string;
  title: string;
  exact: boolean;
  width: number;
  height: number;
  external?: boolean;
  className?: string;
  highlight?: boolean;
  onClick?: Function;
};

// const AnmiatedNotificationIcon = <NotificationIcon pla></NotificationIcon>

const StyledNotificationIcon = styled(NotificationIcon)`
  position: absolute;
  top: -4px;
  right: -3px;
`;

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
  height: ${props => props.height}px;
  width: ${props => props.width}px;
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
      background-color: ${props => props.theme.colors.navBG};
      &:hover {
        background-color: ${props => props.theme.colors.paneBG};
        text-decoration: none;
      }
      color: ${props => props.theme.colors.menuButtonBGInactive};
      &.active {
        background-color: ${props => props.theme.colors.paneBG};
        color: ${props => props.theme.colors.textOnDarkBG};
        ${IconContainer} {
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

const Anchor = styled.a`
  width: 64px;
  display: inline-block;
`;

const ExternalLink = function(props: any) {
  return (
    <Anchor
      onClick={() => {
        props.onClick && props.onClick();
      }}
      href={props.to}
      className={props.className}
      target="_blank"
    >
      {props.children}
    </Anchor>
  );
};

const DetailsContainer = styled.div`
  position: relative;
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
      external,
      highlight,
      onClick,
    } = this.props;
    const Link = external ? ExternalLink : NavLink;
    return (
      <ItemContainer>
        <Link
          exact={exact}
          to={path}
          className={this.props.className}
          onClick={() => {
            onClick && onClick();
            AnalyticsUtil.logEvent("SIDEBAR_NAVIGATION", {
              navPage: this.props.title.toUpperCase(),
            });
          }}
        >
          <DetailsContainer>
            <IconContainer width={width} height={height}>
              {icon({ width: width - 8, height: height - 8 })}
            </IconContainer>
            <span>{title}</span>
            {highlight && (
              <StyledNotificationIcon
                animate
                width={9}
                height={9}
                color={theme.colors.primary}
              />
            )}
          </DetailsContainer>
        </Link>
      </ItemContainer>
    );
  }
}

export default NavBarItem;
