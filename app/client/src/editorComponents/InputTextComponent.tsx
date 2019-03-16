import * as React from "react";
import { IComponentProps } from "./BaseComponent";
import PositionContainer from "./PositionContainer";

class InputTextComponent extends React.Component<IInputTextComponentProps> {
  render() {
    return (
      <PositionContainer {...this.props}>
        <input
          placeholder={this.props.placeholder}
          type={this.props.type}
          id={this.props.id}
          required={this.props.required}
          minLength={this.props.minLength}
          maxLength={this.props.maxLength}
          size={this.props.size}
        />
      </PositionContainer>
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
