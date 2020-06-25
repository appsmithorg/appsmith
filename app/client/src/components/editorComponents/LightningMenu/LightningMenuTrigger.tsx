import React from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as LightningIcon } from "assets/icons/control/lightning.svg";
import { LIGHTNING_MENU_DATA_TOOLTIP } from "constants/messages";
import { Theme, Skin } from "constants/DefaultTheme";
import styled from "styled-components";
import { Tooltip } from "@blueprintjs/core";

const LightningIconWrapper = styled.span<{
  background: string;
  skin: Skin;
  isFocused: boolean;
}>`
  background: ${props => (props.isFocused ? "none" : props.background)};
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
  isFocused: boolean;
  isOpened: boolean;
  skin: Skin;
  theme: Theme;
  onOpenLightningMenu: () => void;
}

type MenuState = "none" | "default" | "active" | "hover";

export const LightningMenuTrigger = (props: LightningMenuTriggerProps) => {
  const getMenuState = () => {
    let menuState: MenuState = "none";
    if (props.isOpened) {
      menuState = "active";
    }
    if (props.isFocused) {
      menuState = "default";
    }
    const { background, color } = props.theme.lightningMenu[props.skin][
      menuState
    ];
    const iconProps: IconProps = {
      width: 14,
      height: 14,
      color: color,
    };

    return {
      iconProps,
      background,
    };
  };
  const { background, iconProps } = getMenuState();
  return (
    <LightningIconWrapper
      background={background}
      onClick={() => {
        if (props.onOpenLightningMenu) {
          props.onOpenLightningMenu();
        }
      }}
      skin={props.skin}
      className="lightning-menu"
      isFocused={props.isFocused}
    >
      <Tooltip
        autoFocus={false}
        hoverOpenDelay={1000}
        content={LIGHTNING_MENU_DATA_TOOLTIP}
      >
        <IconWrapper {...iconProps}>
          <LightningIcon />
        </IconWrapper>
      </Tooltip>
    </LightningIconWrapper>
  );
};
