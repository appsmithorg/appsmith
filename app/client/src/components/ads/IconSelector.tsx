import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import AppIcon, { AppIconName, AppIconCollection } from "./AppIcon";
import { Size } from "./Button";
import { CommonComponentProps, Classes } from "./common";
import ScrollIndicator from "components/ads/ScrollIndicator";

export type IconSelectorProps = CommonComponentProps & {
  onSelect?: (icon: AppIconName) => void;
  selectedColor: string;
  selectedIcon?: AppIconName;
  iconPalette?: AppIconName[];
  fill?: boolean;
};

const IconPalette = styled.div<{ fill?: boolean }>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  padding: ${(props) => props.theme.spaces[4]}px 0px
    ${(props) => props.theme.spaces[4]}px ${(props) => props.theme.spaces[5]}px;
  width: ${(props) => (props.fill ? "100%" : "234px")};
  max-height: 90px;
  overflow-y: auto;
  &&::-webkit-scrollbar-thumb {
    background-color: ${(props) => props.theme.colors.modal.scrollbar};
  }
  &::-webkit-scrollbar {
    width: 4px;
  }
`;

const IconBox = styled.div<{ selectedColor?: string }>`
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) =>
    props.selectedColor || props.theme.colors.appIcon.background};
  margin: 0 ${(props) => props.theme.spaces[2]}px
    ${(props) => props.theme.spaces[2]}px 0;
  position: relative;

  &:nth-child(6n) {
    margin-right: ${(props) => props.theme.spaces[0]}px;
  }

  ${(props) =>
    props.selectedColor
      ? `.${Classes.APP_ICON} {
    svg {
      path {
        fill: #fff;
      }
    }
  }`
      : null};
`;

function IconSelector(props: IconSelectorProps) {
  const iconRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<AppIconName>(firstSelectedIcon());
  const iconPaletteRef = React.createRef<HTMLDivElement>();
  const [iconPalette, setIconPalette] = useState(props.iconPalette);

  useEffect(() => {
    if (props.selectedIcon && iconRef.current) {
      // make selected icon in first position
      // also, this will happen only when the pop up opens
      // after that if user select an icon it won't change the position
      if (
        iconPalette &&
        props.iconPalette &&
        iconPalette[0] === props.iconPalette[0]
      ) {
        const _iconPalette = iconPalette ? [...iconPalette] : [];
        _iconPalette?.splice(_iconPalette.indexOf(props.selectedIcon), 1);
        _iconPalette?.splice(0, 0, props.selectedIcon);
        setIconPalette(_iconPalette);
      }
      // icon position change ends here
      setSelected(props.selectedIcon);
    }
  }, [props.selectedIcon]);

  function firstSelectedIcon() {
    if (props.iconPalette && props.iconPalette[0]) {
      return props.iconPalette[0];
    }
    return AppIconCollection[0];
  }

  return (
    <IconPalette
      className={props.className}
      data-cy={props.cypressSelector}
      fill={props.fill}
      ref={iconPaletteRef}
    >
      {iconPalette &&
        iconPalette.map((iconName: AppIconName, index: number) => {
          return (
            <IconBox
              {...(selected === iconName ? { ref: iconRef } : {})}
              className={
                selected === iconName
                  ? "t--icon-selected"
                  : "t--icon-not-selected"
              }
              key={index}
              onClick={() => {
                if (iconName !== selected) {
                  setSelected(iconName);
                  props.onSelect && props.onSelect(iconName);
                }
              }}
              selectedColor={selected === iconName ? props.selectedColor : ""}
            >
              <AppIcon name={iconName} size={Size.small} />
            </IconBox>
          );
        })}
      <ScrollIndicator containerRef={iconPaletteRef} mode="DARK" />
    </IconPalette>
  );
}

IconSelector.defaultProps = {
  fill: false,
  iconPalette: AppIconCollection,
};

export default IconSelector;
