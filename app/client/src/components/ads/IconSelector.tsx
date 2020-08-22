import React, { useState } from "react";
import styled from "styled-components";
import AppIcon, { AppIconName } from "./AppIcon";
import { Size } from "./Button";
import { CommonComponentProps } from "./common";

export const appIconPalette: AppIconName[] = [
  "bag",
  "product",
  "book",
  "camera",
  "file",
  "chat",
  "calender",
  "flight",
  "frame",
  "globe",
  "shopper",
  "heart",
];

type IconSelectorProps = CommonComponentProps & {
  onSelect: (icon: AppIconName) => void;
  selectedColor: string;
  iconPalette?: AppIconName[];
  isFill?: boolean;
};

const WrapperDiv = styled.div<{ isFill?: boolean }>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: ${props => (props.isFill ? "100%" : "234px")};
`;

const IconDiv = styled.div<{
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

  .ads-icon {
    svg {
      path {
        fill: ${props => props.theme.colors.blackShades[9]};
      }
    }
  }

  &:last-child {
    margin-right: ${props => props.theme.spaces[0]}px;
  }
`;

const IconSelector = (props: IconSelectorProps) => {
  const [selected, setSelected] = useState<AppIconName>(appIconPalette[0]);

  return (
    <WrapperDiv isFill={props.isFill}>
      {props.iconPalette &&
        props.iconPalette.map((iconName: AppIconName, index: number) => {
          return (
            <IconDiv
              key={index}
              selected={selected}
              iconName={iconName}
              bgColor={props.selectedColor}
              onClick={() => {
                setSelected(iconName);
                return props.onSelect(iconName);
              }}
            >
              <AppIcon name={iconName} size={Size.large} />
            </IconDiv>
          );
        })}
    </WrapperDiv>
  );
};

IconSelector.defaultProps = {
  isFill: false,
  iconPalette: appIconPalette,
};

export default IconSelector;
