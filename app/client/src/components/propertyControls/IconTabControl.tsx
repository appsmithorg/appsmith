import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { FlexWrapper } from "./StyledControls";
import styled from "styled-components";
import { ControlIcons, ControlIconName } from "icons/ControlIcons";
import { Colors } from "constants/Colors";

const ItemWrapper = styled.div<{ selected: boolean }>`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.selected ? "rgb(3, 179, 101)" : "#21282C")};
  cursor: pointer;
  &:first-of-type {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  &:last-of-type {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
`;

class IconTabControl extends BaseControl<IconTabControlProps> {
  selectOption = (value: string) => {
    const { propertyValue, defaultValue } = this.props;
    if (propertyValue === value) {
      this.updateProperty(this.props.propertyName, defaultValue);
    } else {
      this.updateProperty(this.props.propertyName, value);
    }
  };
  render() {
    const { propertyValue, options } = this.props;
    return (
      <FlexWrapper>
        {options.map((option, index) => {
          const controlIconName: ControlIconName = option.icon;
          const ControlIcon = ControlIcons[controlIconName];
          return (
            <ItemWrapper
              key={index}
              selected={propertyValue === option.value}
              onClick={() => this.selectOption(option.value)}
              className={`t--icon-tab-${option.value}`}
            >
              <ControlIcon color={Colors.WHITE} width={24} height={24} />
            </ItemWrapper>
          );
        })}
      </FlexWrapper>
    );
  }

  static getControlType() {
    return "ICON_TABS";
  }
}

interface IconTabOption {
  icon: string;
  value: string;
}

export interface IconTabControlProps extends ControlProps {
  options: IconTabOption[];
  defaultValue: string;
}

export default IconTabControl;
