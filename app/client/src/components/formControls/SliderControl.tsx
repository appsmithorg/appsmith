import React from "react";
import { Field, type WrappedFieldInputProps } from "redux-form";
import BaseControl from "./BaseControl";
import type { ControlProps } from "./BaseControl";
import { Slider, type SliderProps } from "@appsmith/ads";

export interface SliderControlProps extends ControlProps {
  maxValue?: number;
  minValue?: number;
  step?: number;
  defaultValue?: number;
  onChangeEnd?: (value: number) => void;
}

export class SliderControl extends BaseControl<SliderControlProps> {
  render() {
    const { configProperty, ...rest } = this.props;

    return (
      <Field
        component={renderSliderControl}
        name={configProperty}
        props={{ ...rest }}
      />
    );
  }

  getControlType(): string {
    return "SLIDER";
  }
}

const renderSliderControl = (
  props: {
    input?: WrappedFieldInputProps;
  } & SliderControlProps,
) => {
  const { input, maxValue, minValue, step, title } = props;

  return (
    <Slider
      defaultValue={input?.value}
      // use title as label because UQI label form placed above the component witch breaks the layout
      label={title}
      maxValue={maxValue}
      minValue={minValue}
      onChangeEnd={input?.onChange}
      step={step}
    />
  );
};
