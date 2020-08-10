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
  right: ${props => (props.skin === Skin.LIGHT ? 1 : 1)}px;
  top: ${props => (props.skin === Skin.LIGHT ? 1 : 1)}px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 2px;
  width: ${props => (props.skin === Skin.LIGHT ? 30 : 30)}px;
  height: ${props => (props.skin === Skin.LIGHT ? 30 : 30)}px;
  z-index: 10;
  cursor: pointer;
  &:hover {
    background: ${props => props.isFocused && props.background};
  }
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
      width: 18,
      height: 18,
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
        openOnTargetFocus={false}
      >
        <IconWrapper {...iconProps}>
          <LightningIcon />
        </IconWrapper>
      </Tooltip>
    </LightningIconWrapper>
  );
};
