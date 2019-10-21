import React from "react";
import styled from "styled-components";
import { withRouter, RouteComponentProps } from "react-router";

type MenuBarItemProps = {
  icon: Function;
  path: string;
  title: string;
};

type Props = MenuBarItemProps & RouteComponentProps;

type ActiveProps = {
  active: boolean;
};

const ItemContainer = styled.div<ActiveProps>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 60px;
  font-size: ${props => props.theme.fontSizes[1]}px;
  cursor: pointer;
  margin: ${props => props.theme.spaces[3]}px 0;
  background-color: ${props =>
    props.active ? props.theme.colors.paneBG : props.theme.colors.navBG}
  &:hover {
    background-color: ${props => props.theme.colors.paneBG};
  }
`;

const IconContainer = styled.div<ActiveProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  margin-bottom: 2px;
  background-color: ${props =>
    props.active
      ? props.theme.colors.primary
      : props.theme.colors.menuButtonBGInactive};
  border-radius: ${props => props.theme.radii[1]}px;
  height: 32px;
  width: 32px;
  svg path {
    fill: ${props =>
      props.active
        ? props.theme.colors.textOnDarkBG
        : props.theme.colors.menuIconColorInactive};
  }
`;

class NavBarItem extends React.Component<Props> {
  handleItemClick = () => {
    const { history, path } = this.props;
    history.push(path);
  };

  render(): React.ReactNode {
    const { title, icon, location, path } = this.props;
    const isActive = location.pathname === path;
    return (
      <ItemContainer active={isActive} onClick={this.handleItemClick}>
        <IconContainer active={isActive}>{icon()}</IconContainer>
        {title}
      </ItemContainer>
    );
  }
}

export default withRouter(NavBarItem);
