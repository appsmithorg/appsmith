import * as React from "react";
import { IComponentProps } from "./BaseComponent";
import styled from "../constants/DefaultTheme";

const InputTextContainer = styled("span")<IInputTextComponentProps>`
  color: ${props => props.theme.primaryColor};
  position: ${props => props.style.positionType};
  left: ${props => {
    return props.style.xPosition + props.style.xPositionUnit;
  }};
  top: ${props => {
    return props.style.yPosition + props.style.yPositionUnit;
  }};
`;

class InputTextComponent extends React.Component<IInputTextComponentProps> {
  render() {
    return (
      <InputTextContainer {...this.props}>
        <input
          placeholder={this.props.placeholder}
          type={this.props.type}
          id={this.props.id}
          required={this.props.required}
          minLength={this.props.minLength}
          maxLength={this.props.maxLength}
          size={this.props.size}
        />
      </InputTextContainer>
    );
  }
}

export interface IInputTextComponentProps extends IComponentProps {
  id?: string;
  type?: string;
  placeholder?: string;
  ellipsize?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  size?: number;
}

export default InputTextComponent;
