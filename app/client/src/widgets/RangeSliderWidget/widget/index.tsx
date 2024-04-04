import * as React from "react";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { TAILWIND_COLORS } from "constants/ThemeConstants";

import type { RangeSliderComponentProps } from "../component/RangeSlider";
import RangeSliderComponent from "../component/RangeSlider";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";

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
  static type = "RANGE_SLIDER_WIDGET";

  static getConfig() {
    return {
      name: "Range Slider",
      needsMeta: true,
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.SLIDERS],
    };
  }

  static getDefaults() {
    return {
      min: 0,
      max: 100,
      minRange: 5,
      step: 1,
      showMarksLabel: true,
      defaultStartValue: 10,
      defaultEndValue: 100,
      marks: [
        { value: 25, label: "25%" },
        { value: 50, label: "50%" },
        { value: 75, label: "75%" },
      ],
      isVisible: true,
      isDisabled: false,
      tooltipAlwaysOn: false,
      labelText: "Percentage",
      labelPosition: LabelPosition.Top,
      labelAlignment: Alignment.LEFT,
      labelWidth: 8,
      labelTextSize: "0.875rem",
      rows: 8,
      columns: 40,
      widgetName: "RangeSlider",
      shouldScroll: false,
      shouldTruncate: false,
      version: 1,
      animateLoading: true,
      sliderSize: "m",
      responsiveBehavior: ResponsiveBehavior.Fill,
    };
  }

  static getAutoLayoutConfig() {
    return {
      disabledPropsDefaults: {
        labelPosition: LabelPosition.Top,
        labelTextSize: "0.875rem",
      },
      defaults: {
        rows: 7,
        columns: 40,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "180px",
              minHeight: "70px",
            };
          },
        },
      ],
      disableResizeHandles: {
        vertical: true,
      },
    };
  }

  static getAnvilConfig(): AnvilConfig | null {
    return {
      isLargeWidget: false,
      widgetSize: {
        maxHeight: {},
        maxWidth: {},
        minHeight: { base: "70px" },
        minWidth: { base: "180px" },
      },
    };
  }

  static getPropertyPaneContentConfig() {
    return contentConfig;
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisable: {
          path: "isDisabled",
          type: "boolean",
        },
      },
    };
  }

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Range slider widget is used to capture user feedback from a range of values",
      "!url": "https://docs.appsmith.com/widget-reference/circular-progress",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      start: "number",
      end: "number",
    };
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

  static getDefaultPropertiesMap(): Record<string, string> {
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

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
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

  getWidgetView() {
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
        labelTooltip={this.props.labelTooltip}
        labelWidth={this.props.labelComponentWidth}
        // If showMarks is off don't show marks at all
        loading={this.props.isLoading}
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
}

export default RangeSliderWidget;
