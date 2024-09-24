import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import type { AppIconName } from "../AppIcon";
import AppIcon, { AppIconCollection } from "../AppIcon";
import { Size } from "../AppIcon";
import type { CommonComponentProps } from "../types/common";
import { Classes } from "../constants/classes";

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
  gap: var(--ads-v2-spaces-2);
  padding: var(--ads-spaces-4) 0px var(--ads-spaces-4) var(--ads-spaces-5);
  width: ${(props) => (props.fill ? "100%" : "234px")};
  max-height: 90px;
  overflow-y: auto;
`;

const IconBox = styled.div<{ selectedColor?: string }>`
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: var(--ads-v2-border-radius);
  background-color: ${(props) => props.selectedColor};
  margin: 0;
  position: relative;

  ${(props) =>
    props.selectedColor
      ? `.${Classes.APP_ICON} {
    svg {
      path {
        fill: var(--ads-icon-selector-selected-icon-fill-color);
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
  const { onSelect } = props;

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
                  onSelect && onSelect(iconName);
                }
              }}
              selectedColor={selected === iconName ? props.selectedColor : ""}
            >
              <AppIcon name={iconName} size={Size.small} />
            </IconBox>
          );
        })}
    </IconPalette>
  );
}

IconSelector.defaultProps = {
  fill: false,
  iconPalette: AppIconCollection,
};

export default IconSelector;
