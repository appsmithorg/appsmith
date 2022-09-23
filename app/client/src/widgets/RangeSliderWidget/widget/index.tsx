import * as React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { TAILWIND_COLORS } from "constants/ThemeConstants";

import RangeSliderComponent, {
  RangeSliderComponentProps,
} from "../component/RangeSlider";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";

export interface RangeSliderWidgetProps
  extends WidgetProps,
    RangeSliderComponentProps {
  /** Color from theme.colors */
  accentColor?: string;

  /** defaultStart Value */
  defaultStartValue?: number;

  /** defaultEnd Value */
  defaultEndValue?: number;

  /** start value metaProperty */
  start: number;

  /** end value metaProperty  */
  end: number;

  /** isDirty meta property */
  isDirty: boolean;

  /**
   * onStartChange action selector triggers when
   * the first thumb of slider is changed
   */
  onStartChange: string;

  /**
   * onEndChange action selector triggers when
   * the second thumb of slider is changed
   */
  onEndChange: string;
}

class RangeSliderWidget extends BaseWidget<
  RangeSliderWidgetProps,
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

  componentDidUpdate(prevProps: RangeSliderWidgetProps) {
    /**
     * If you change the defaultValues from the propertyPane
     * or say an input widget you are basically resetting the widget
     * therefore we reset the isDirty.
     */
    if (
      (this.props.defaultStartValue !== prevProps.defaultStartValue ||
        this.props.defaultEndValue !== prevProps.defaultEndValue) &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  static getDefaultPropertiesMap(): Record<string, unknown> {
    return {
      start: "defaultStartValue",
      end: "defaultEndValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, unknown> {
    return {
      start: 0,
      end: 20,
      isDirty: false,
    };
  }

  onChangeEnd = ([start, end]: [number, number]) => {
    if (this.props.start !== start) {
      this.props.updateWidgetMetaProperty("start", start, {
        triggerPropertyName: "onStartChange",
        dynamicString: this.props.onStartValueChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      });
    }

    if (this.props.end !== end) {
      this.props.updateWidgetMetaProperty("end", end, {
        triggerPropertyName: "onEndChange",
        dynamicString: this.props.onEndValueChange,
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
      <RangeSliderComponent
        color={this.props.accentColor || TAILWIND_COLORS.green["600"]}
        disabled={this.props.isDisabled}
        endValue={this.props.end}
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
        minRange={this.props.minRange}
        name={this.props.widgetName}
        onChangeEnd={this.onChangeEnd}
        showMarksLabel={this.props.showMarksLabel}
        sliderSize={this.props.sliderSize}
        sliderTooltip={this.getSliderTooltip}
        startValue={this.props.start}
        step={this.props.step}
        tooltipAlwaysOn={this.props.tooltipAlwaysOn}
      />
    );
  }

  static getWidgetType() {
    return "RANGE_SLIDER_WIDGET";
  }
}

export default RangeSliderWidget;
