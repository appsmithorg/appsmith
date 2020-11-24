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
  background: ${props => (props.selected ? "#29CCA3" : "#21282C")};
  border-radius: 4px;
  cursor: pointer;
  &:first-of-type {
    margin-right: 4px;
  }
`;

class ButtonTabControl extends BaseControl<ButtonTabControlProps> {
  selectButton = (value: string) => {
    const { propertyValue, defaultValue } = this.props;
    const values = propertyValue?.length
      ? propertyValue
      : defaultValue?.length
      ? defaultValue
      : [];
    if (values.includes(value)) {
      values.splice(1, values.indexOf(value));
    } else {
      values.push(value);
    }
    this.updateProperty(this.props.propertyName, values);
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
              selected={
                Array.isArray(propertyValue) &&
                propertyValue.includes(option.value)
              }
              onClick={() => this.selectButton(option.value)}
              className={`t--button-tab-${option.value}`}
            >
              <ControlIcon color={Colors.WHITE} width={24} height={24} />
            </ItemWrapper>
          );
        })}
      </FlexWrapper>
    );
  }

  static getControlType() {
    return "BUTTON_TABS";
  }
}

interface ButtonTabOption {
  icon: string;
  value: string;
}

export interface ButtonTabControlProps extends ControlProps {
  options: ButtonTabOption[];
  defaultValue: string;
}

export default ButtonTabControl;
