import React from "react";
import { IconProps } from "constants/IconConstants";
import { createMessage, LIGHTNING_MENU_DATA_TOOLTIP } from "constants/messages";
import { Theme, Skin } from "constants/DefaultTheme";
import styled from "styled-components";
import Icon, { IconSize } from "components/ads/Icon";
import { Position } from "@blueprintjs/core";
import Tooltip from "components/ads/Tooltip";

const LightningIconWrapper = styled.span<{
  background: string;
  skin: Skin;
  isFocused: boolean;
  color?: string;
}>`
  background: ${(props) => (props.isFocused ? "none" : props.background)};
  position: absolute;
  right: ${(props) => (props.skin === Skin.LIGHT ? 1 : 1)}px;
  top: ${(props) => (props.skin === Skin.LIGHT ? 1 : 1)}px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 0px;
  svg path {
    fill: ${(props) => !props.isFocused && props.color};
  }
  width: ${(props) => (props.skin === Skin.LIGHT ? 32 : 32)}px;
  height: ${(props) => (props.skin === Skin.LIGHT ? 32 : 32)}px;
  z-index: 10;
  cursor: pointer;
  &:hover {
    background: ${(props) => props.isFocused && props.background};
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
      color={iconProps.color}
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
        content={createMessage(LIGHTNING_MENU_DATA_TOOLTIP)}
        autoFocus={false}
        hoverOpenDelay={1000}
        openOnTargetFocus={false}
        minWidth={"180px"}
        position={Position.LEFT}
      >
        <Icon name="lightning" size={IconSize.LARGE} />
      </Tooltip>
    </LightningIconWrapper>
  );
};
