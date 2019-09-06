import * as React from "react"
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget"
import { WidgetType } from "../constants/WidgetConstants"
import RadioGroupComponent from "../editorComponents/RadioGroupComponent"
import { IOptionProps } from "@blueprintjs/core"

class RadioButtonWidget extends BaseWidget<
  RadioGroupWidgetProps,
  IWidgetState
> {

  getPageView() {
    return (
      <RadioGroupComponent
        style={this.getPositionStyle()}
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        inline={this.props.inline}
        label={this.props.label}
        name={this.props.name}
        handleRadioChange={this.props.handleRadioChange}
        selectedValue={this.props.selectedValue}
        items={this.props.items}
        disabled={this.props.disabled}
        className={this.props.className}
        options={this.props.options}
      />
    )
  }

  getWidgetType(): WidgetType {
    return "RADIO_GROUP_WIDGET"
  }
}

export interface RadioGroupWidgetProps extends IWidgetProps {
  label: string;
  inline: boolean;
  selectedValue: string | number;
  handleRadioChange: (event: React.FormEvent<HTMLInputElement>) => void;
  disabled: boolean;
  className: string;
  name: string;
  options: IOptionProps[];
  items: Array<{
    label: string;
    value: number | string;
  }>;
}

export default RadioButtonWidget
