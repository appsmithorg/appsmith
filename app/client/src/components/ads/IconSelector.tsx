import React, { useState, useEffect } from "react";
import styled from "styled-components";
import AppIcon, { AppIconName, AppIconCollection } from "./AppIcon";
import { Size } from "./Button";
import { CommonComponentProps, Classes } from "./common";

type IconSelectorProps = CommonComponentProps & {
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
  padding: ${props => props.theme.spaces[4]}px
    ${props => props.theme.spaces[5]}px;
  width: ${props => (props.fill ? "100%" : "234px")};
`;

const IconBox = styled.div<{ selectedColor?: string }>`
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${props =>
    props.selectedColor || props.theme.colors.appIcon.background};
  margin: 0 ${props => props.theme.spaces[2]}px
    ${props => props.theme.spaces[2]}px 0;
  position: relative;

  &:nth-child(6n) {
    margin-right: ${props => props.theme.spaces[0]}px;
  }

  ${props =>
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

const IconSelector = (props: IconSelectorProps) => {
  function firstSelectedIcon() {
    if (props.iconPalette && props.iconPalette[0]) {
      return props.iconPalette[0];
    }
    return AppIconCollection[0];
  }

  const [selected, setSelected] = useState<AppIconName>(firstSelectedIcon());

  useEffect(() => {
    if (props.selectedIcon) {
      setSelected(props.selectedIcon);
    }
  }, [props.selectedIcon]);

  return (
    <IconPalette fill={props.fill} data-cy={props.cypressSelector}>
      {props.iconPalette &&
        props.iconPalette.map((iconName: AppIconName, index: number) => {
          return (
            <IconBox
              key={index}
              selectedColor={selected === iconName ? props.selectedColor : ""}
              onClick={() => {
                setSelected(iconName);
                props.onSelect && props.onSelect(iconName);
              }}
            >
              <AppIcon name={iconName} size={Size.small} />
            </IconBox>
          );
        })}
    </IconPalette>
  );
};

IconSelector.defaultProps = {
  fill: false,
  iconPalette: AppIconCollection,
};

export default IconSelector;
