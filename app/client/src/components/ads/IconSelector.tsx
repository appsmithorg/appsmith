import React, { useState } from "react";
import styled from "styled-components";
import { Size } from "./Button";
import { CommonComponentProps } from "./common";
import { Icon, IconName } from "./Icon";

export const appIconPalette = [
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
  onSelect: (icon: IconName) => void;
  selectedColor: string;
  iconPalette?: IconName[];
  isFill?: boolean;
};

const WrapperDiv = styled.div<{ isFill?: boolean }>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: ${props => (props.isFill ? "100%" : "234px")};
`;

const IconDiv = styled.div<{
  iconName: IconName;
  selected: IconName;
  bgColor: string;
}>`
  padding: ${props => props.theme.spaces[2]}px
    ${props => props.theme.spaces[2] - 1}px;
  margin: 0 ${props => props.theme.spaces[2]}px
    ${props => props.theme.spaces[2]}px 0;
  background-color: ${props =>
    props.selected === props.iconName ? props.bgColor : "#232324"};
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
  const [selected, setSelected] = useState<IconName>();

  return (
    <WrapperDiv isFill={props.isFill}>
      {props.iconPalette &&
        props.iconPalette.map((iconName: IconName, index: number) => {
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
              <Icon name={iconName} size={Size.large} />
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
