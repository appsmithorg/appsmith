import React, { useState, useEffect } from "react";
import styled from "styled-components";
import AppIcon, { AppIconName } from "./AppIcon";
import { Size } from "./Button";
import { CommonComponentProps } from "./common";

export const appIconPalette = [
  AppIconName.BAG,
  AppIconName.PRODUCT,
  AppIconName.BOOK,
  AppIconName.CAMERA,
  AppIconName.FILE,
  AppIconName.CHAT,
  AppIconName.CALENDER,
  AppIconName.FLIGHT,
  AppIconName.FRAME,
  AppIconName.GLOBE,
  AppIconName.SHOPPER,
  AppIconName.HEART,
];

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
  width: ${props => (props.fill ? "100%" : "234px")};
`;

const IconBox = styled.div<{
  iconName: AppIconName;
  selected: AppIconName;
  bgColor: string;
}>`
  padding: ${props => props.theme.spaces[2]}px
    ${props => props.theme.spaces[2] - 1}px;
  margin: 0 ${props => props.theme.spaces[2]}px
    ${props => props.theme.spaces[2]}px 0;
  background-color: ${props =>
    props.selected === props.iconName
      ? props.bgColor
      : props.theme.colors.blackShades[2]};
  cursor: pointer;
  position: relative;

  &:last-child {
    margin-right: ${props => props.theme.spaces[0]}px;
  }
`;

const IconSelector = (props: IconSelectorProps) => {
  const [selected, setSelected] = useState<AppIconName>(appIconPalette[0]);

  useEffect(() => {
    if (props.selectedIcon) {
      setSelected(props.selectedIcon);
    }
  }, [props.selectedIcon]);

  return (
    <IconPalette fill={props.fill}>
      {props.iconPalette &&
        props.iconPalette.map((iconName: AppIconName, index: number) => {
          return (
            <IconBox
              key={index}
              selected={selected}
              iconName={iconName}
              bgColor={props.selectedColor}
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
  iconPalette: appIconPalette,
};

export default IconSelector;
