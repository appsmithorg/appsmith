import React, { useState, useEffect } from "react";
import styled from "styled-components";
import AppIcon, { AppIconName, AppIconCollection } from "./AppIcon";
import { Size } from "./Button";
import { CommonComponentProps } from "./common";

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

const IconBox = styled.div`
  margin: 0 ${props => props.theme.spaces[2]}px
    ${props => props.theme.spaces[2]}px 0;
  position: relative;

  &:nth-child(6n) {
    margin-right: ${props => props.theme.spaces[0]}px;
  }
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
    <IconPalette fill={props.fill}>
      {props.iconPalette &&
        props.iconPalette.map((iconName: AppIconName, index: number) => {
          return (
            <IconBox
              key={index}
              onClick={() => {
                setSelected(iconName);
                props.onSelect && props.onSelect(iconName);
              }}
            >
              <AppIcon
                name={iconName}
                size={Size.small}
                color={selected === iconName ? props.selectedColor : "#232324"}
              />
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
