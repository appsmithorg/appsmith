import React from "react";
import styled from "styled-components";
import { ControlIcons, ControlIconName } from "icons/ControlIcons";

const ItemWrapper = styled.div<{ selected: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) =>
    props.selected
      ? props.theme.colors.propertyPane.activeButtonText
      : props.theme.colors.propertyPane.multiDropdownBoxHoverBg};
  cursor: pointer;
  &:first-of-type {
    margin-right: 4px;
  }
  &&& svg {
    path {
      fill: ${(props) =>
        props.selected
          ? props.theme.colors.propertyPane.buttonText
          : props.theme.colors.propertyPane.jsIconBg} !important;
    }
  }
`;

const FlexWrapper = styled.div`
  display: flex;
`;

export interface ButtonTabOption {
  icon: string;
  value: string;
}

interface ButtonTabComponentProps {
  options: ButtonTabOption[];
  values: Array<string>;
  selectButton: (value: string) => void;
}

function ButtonTabComponent(props: ButtonTabComponentProps) {
  return (
    <FlexWrapper>
      {props.options.map((option: ButtonTabOption, index: number) => {
        const controlIconName: ControlIconName = option.icon;
        const ControlIcon = ControlIcons[controlIconName];
        const isSelected = props.values.includes(option.value);
        return (
          <ItemWrapper
            className={`t--button-tab-${option.value}`}
            key={index}
            onClick={() => props.selectButton(option.value)}
            selected={isSelected}
          >
            <ControlIcon height={24} width={24} />
          </ItemWrapper>
        );
      })}
    </FlexWrapper>
  );
}

export default ButtonTabComponent;
