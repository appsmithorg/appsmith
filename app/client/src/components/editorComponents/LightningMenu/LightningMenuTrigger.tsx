import React from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as LightningIcon } from "assets/icons/control/lightning.svg";
import { Theme, Skin } from "constants/DefaultTheme";
import styled from "styled-components";

const LightningIconWrapper = styled.span<{ background: string }>`
  background: ${props => props.background};
  position: absolute;
  right: 0;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 32px;
  height: 32px;
  z-index: 10;
  cursor: pointer;
`;

interface LightningMenuTriggerProps {
  isHover: boolean;
  isFocused: boolean;
  skin: Skin;
  theme: Theme;
}

type MenuState = "none" | "default" | "active" | "hover";

interface LightningMenuTriggerState {
  menuState: MenuState;
}

export default class LightningMenuTrigger extends React.Component<
  LightningMenuTriggerProps,
  LightningMenuTriggerState
> {
  constructor(props: LightningMenuTriggerProps) {
    super(props);
    this.state = {
      menuState: "none",
    };
  }

  componentDidUpdate(prevProps: LightningMenuTriggerProps) {
    if (prevProps.isHover !== this.props.isHover) {
      if (this.props.isHover) {
        this.setState({
          menuState: "hover",
        });
      } else {
        this.setState({
          menuState: "none",
        });
      }
    } else if (prevProps.isFocused !== this.props.isFocused) {
      if (this.props.isFocused) {
        this.setState({
          menuState: "active",
        });
      } else if (this.props.isHover) {
        this.setState({
          menuState: "hover",
        });
      }
    }
  }

  updateMenuState = (menuState: MenuState) => {
    this.setState({ menuState });
  };

  render() {
    const { menuState } = this.state;
    const { skin, theme } = this.props;
    const iconProps: IconProps = {
      width: 14,
      height: 14,
      color: theme.lightningMenu[skin][menuState].color,
    };
    console.log("menu state", menuState);
    return (
      <LightningIconWrapper
        background={theme.lightningMenu[skin][menuState].background}
        onMouseOver={() => {
          this.updateMenuState("hover");
        }}
        onMouseOut={() => {
          // this.updateMenuState("none");
        }}
        onClick={() => {
          this.updateMenuState("active");
        }}
      >
        <IconWrapper {...iconProps}>
          <LightningIcon />
        </IconWrapper>
      </LightningIconWrapper>
    );
  }
}
