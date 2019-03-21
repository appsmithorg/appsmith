import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType } from "../constants/WidgetConstants"
import NumericInputComponent from "../editorComponents/NumericInputComponent"
import { Intent, IconName } from "@blueprintjs/core"
import _ from "lodash"

class NumericInputWidget extends BaseWidget<
  INumericInputWidgetProps,
  IWidgetState
> {
  constructor(widgetProps: INumericInputWidgetProps) {
    super(widgetProps)
  }

  getPageView() {
    return (
      <NumericInputComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        placeholder="Enter a number..."
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
    )
  }

  getWidgetType(): WidgetType {
    return "NUMERIC_INPUT_WIDGET"
  }
}

export interface INumericInputWidgetProps extends IWidgetProps {
  className?: string
  disabled?: boolean
  large?: boolean
  intent?: Intent
  defaultValue?: string
  leftIcon?: IconName
  rightElement?: JSX.Element
  allowNumericCharactersOnly?: boolean
  fill?: boolean
  majorStepSize?: number | null
  max?: number
  min?: number
  minorStepSize?: number | null
  onValueChange?: (valueAsNumber: number, valueAsString: string) => void
  onButtonClick?: (valueAsNumber: number, valueAsString: string) => void
  inputRef?: (ref: HTMLInputElement | null) => any
  selectAllOnFocus?: boolean
  selectAllOnIncrement?: boolean
  stepSize?: number
  placeholder?: string
}

export default NumericInputWidget
