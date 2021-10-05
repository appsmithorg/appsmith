import React from "react";
import styled from "styled-components";
import { ControlIcons, ControlIconName } from "icons/ControlIcons";
import { Colors } from "constants/Colors";

const ItemWrapper = styled.div<{ selected: boolean }>`
  width: auto;
  padding: 0 5px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) =>
    props.selected
      ? Colors.GREY_10
      : props.theme.colors.propertyPane.multiDropdownBoxHoverBg};
  cursor: pointer;
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
  display: inline-flex;
  border: 1px solid ${Colors.GREY_5};
`;

export interface IconTabOption {
  icon: string;
  value: string;
  width?: number;
}

interface IconTabsComponentProps {
  options: IconTabOption[];
  value: string;
  selectOption: (value: string) => void;
}

function IconTabsComponent(props: IconTabsComponentProps) {
  return (
    <FlexWrapper>
      {props.options.map(
        ({ icon, value, width = 24 }: IconTabOption, index: number) => {
          const controlIconName: ControlIconName = icon;
          const ControlIcon = ControlIcons[controlIconName];
          const isSelected = props.value === value;
          return (
            <ItemWrapper
              className={`t--icon-tab-${value}`}
              key={index}
              onClick={() => props.selectOption(value)}
              selected={isSelected}
            >
              <ControlIcon height={24} width={width} />
            </ItemWrapper>
          );
        },
      )}
    </FlexWrapper>
  );
}

export default IconTabsComponent;
