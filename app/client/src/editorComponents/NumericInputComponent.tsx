import * as React from "react"
import { ComponentProps } from "./BaseComponent"
import { Intent, NumericInput, IconName } from "@blueprintjs/core"
import { Container } from "./ContainerComponent"
class NumericInputComponent extends React.Component<
  INumericInputComponentProps
> {
  render() {
    return (
      <Container {...this.props}>
        <NumericInput
          placeholder={this.props.placeholder}
          min={this.props.min}
          max={this.props.max}
          className={this.props.className}
          disabled={this.props.disabled}
          large={this.props.large}
          intent={this.props.intent}
          defaultValue={this.props.defaultValue}
          leftIcon={this.props.leftIcon}
          rightElement={this.props.rightElement}
          allowNumericCharactersOnly={this.props.allowNumericCharactersOnly}
          fill={this.props.fill}
          majorStepSize={this.props.majorStepSize}
          minorStepSize={this.props.minorStepSize}
          onButtonClick={this.props.onButtonClick}
          inputRef={this.props.inputRef}
          selectAllOnFocus={this.props.selectAllOnFocus}
          selectAllOnIncrement={this.props.selectAllOnIncrement}
          stepSize={this.props.stepSize}
        />
      </Container>
    )
  }
}

export interface INumericInputComponentProps extends ComponentProps {
  className?: string;
  disabled?: boolean;
  large?: boolean;
  intent?: Intent;
  defaultValue?: string;
  leftIcon?: IconName;
  rightElement?: JSX.Element;
  allowNumericCharactersOnly?: boolean;
  fill?: boolean;
  majorStepSize?: number | null;
  max?: number;
  min?: number;
  minorStepSize?: number | null;
  onValueChange?: (valueAsNumber: number, valueAsString: string) => void;
  onButtonClick?: (valueAsNumber: number, valueAsString: string) => void;
  inputRef?: (ref: HTMLInputElement | null) => any;
  selectAllOnFocus?: boolean;
  selectAllOnIncrement?: boolean;
  stepSize?: number;
  placeholder?: string;
}

export default NumericInputComponent
