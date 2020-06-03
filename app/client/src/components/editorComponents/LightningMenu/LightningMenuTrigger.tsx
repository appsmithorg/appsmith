import React from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as LightningIcon } from "assets/icons/control/lightning.svg";
import { Theme, Skin } from "constants/DefaultTheme";
import styled from "styled-components";

const LightningIconWrapper = styled.span<{ background: string; skin: Skin }>`
  background: ${props => props.background};
  position: absolute;
  right: ${props => (props.skin === Skin.LIGHT ? 2 : 0)}px;
  top: ${props => (props.skin === Skin.LIGHT ? 1 : 0)}px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${props => (props.skin === Skin.LIGHT ? 30 : 32)}px;
  height: ${props => (props.skin === Skin.LIGHT ? 30 : 32)}px;
  z-index: 10;
  cursor: pointer;
`;

interface LightningMenuTriggerProps {
  isHover: boolean;
  isFocused: boolean;
  isClosed: boolean;
  skin: Skin;
  theme: Theme;
  onOpenLightningMenu: () => void;
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
    const { menuState } = this.state;
    const { isHover, isFocused, isClosed } = this.props;
    // if (menuState !== "none") {
    //   console.log(
    //     "isHover, isFocused, isClosed",
    //     isHover,
    //     isFocused,
    //     isClosed,
    //     menuState,
    //   );
    // }
    if (menuState === "none" && isHover) {
      this.setState({ menuState: "hover" });
    } else if (
      (menuState === "active" && isFocused) ||
      (menuState === "none" && isFocused)
    ) {
      this.setState({ menuState: "default" });
    } else if (
      (menuState === "default" && !isFocused) ||
      (menuState === "hover" && !isHover) ||
      (menuState === "active" && isClosed) ||
      (menuState !== "none" && !isHover && !isFocused && isClosed)
    ) {
      this.setState({ menuState: "none" });
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
    return (
      <LightningIconWrapper
        background={theme.lightningMenu[skin][menuState].background}
        onClick={() => {
          if (this.props.onOpenLightningMenu) {
            this.props.onOpenLightningMenu();
          }
          this.updateMenuState("active");
        }}
        skin={skin}
      >
        <IconWrapper {...iconProps}>
          <LightningIcon />
        </IconWrapper>
      </LightningIconWrapper>
    );
  }
}
