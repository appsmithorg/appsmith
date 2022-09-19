import * as React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { TAILWIND_COLORS } from "constants/ThemeConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import SliderComponent, { SliderComponentProps } from "../component/Slider";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";

export interface NumberSliderWidgetProps
  extends WidgetProps,
    SliderComponentProps {
  /** Color from theme.colors */
  accentColor?: string;

  /** defaultValue for the slider */
  defaultValue?: number;

  /** isDirty meta property */
  isDirty: boolean;

  /** value meta property */
  value: number;

  /** onChangeEnd action selector */
  onChange: string;
}

class NumberSliderWidget extends BaseWidget<
  NumberSliderWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [...contentConfig, ...styleConfig];
  }

  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  componentDidUpdate(prevProps: NumberSliderWidgetProps) {
    /**
     * If you change the defaultValue from the propertyPane
     * or say an input widget you are basically resetting the widget
     * therefore we reset the isDirty.
     */
    if (
      this.props.defaultValue !== prevProps.defaultValue &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  static getDefaultPropertiesMap(): Record<string, unknown> {
    return {
      value: "defaultValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, unknown> {
    return {
      value: 0,
      isDirty: false,
    };
  }

  onChangeEnd = (value: number) => {
    if (this.props.value !== value) {
      this.props.updateWidgetMetaProperty("value", value, {
        triggerPropertyName: "onChange",
        dynamicString: this.props.onChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      });
    }

    // Set isDirty to true when we change slider value
    if (!this.props.isDirty) {
      this.props.updateWidgetMetaProperty("isDirty", true);
    }
  };

  getSliderTooltip = (sliderValue: number) => {
    /**
     * Check if the step is in decimal if yes fix
     * the slider tooltip to only one place decimal
     */
    return this.props.step % 1 !== 0
      ? sliderValue.toFixed(1).toString()
      : sliderValue.toString();
  };

  getPageView() {
    return (
      <SliderComponent
        color={this.props.accentColor || TAILWIND_COLORS.green["600"]}
        disabled={this.props.isDisabled}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelWidth={this.getLabelWidth()}
        loading={this.props.isLoading}
        // If showMarks is off don't show marks at all
        marks={this.props.showMarksLabel ? this.props.marks : []}
        max={this.props.max}
        min={this.props.min}
        name={this.props.widgetName}
        onChangeEnd={this.onChangeEnd}
        showMarksLabel={this.props.showMarksLabel}
        sliderSize={this.props.sliderSize}
        sliderTooltip={this.getSliderTooltip}
        sliderValue={this.props.value}
        step={this.props.step}
        tooltipAlwaysOn={this.props.tooltipAlwaysOn || false}
      />
    );
  }

  static getWidgetType() {
    return "NUMBER_SLIDER_WIDGET";
  }
}

export default NumberSliderWidget;
