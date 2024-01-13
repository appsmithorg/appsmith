import * as React from "react";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { TAILWIND_COLORS } from "constants/ThemeConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { SliderComponentProps } from "../component/Slider";
import SliderComponent from "../component/Slider";
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
import { WIDGET_TAGS } from "constants/WidgetConstants";

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
  static type = "NUMBER_SLIDER_WIDGET";

  static getConfig() {
    return {
      name: "Number Slider",
      needsMeta: true,
      searchTags: ["range"],
      iconSVG: IconSVG,
      tags: [WIDGET_TAGS.SLIDERS],
    };
  }

  static getDefaults() {
    return {
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 10,
      showMarksLabel: true,
      marks: [
        { value: 25, label: "25%" },
        { value: 50, label: "50%" },
        { value: 75, label: "75%" },
      ],
      isVisible: true,
      isDisabled: false,
      tooltipAlwaysOn: false,
      rows: 8,
      columns: 40,
      widgetName: "NumberSlider",
      shouldScroll: false,
      shouldTruncate: false,
      version: 1,
      animateLoading: true,
      labelText: "Percentage",
      labelPosition: LabelPosition.Top,
      labelAlignment: Alignment.LEFT,
      labelWidth: 8,
      labelTextSize: "0.875rem",
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

  static getPropertyPaneStyleConfig() {
    return styleConfig;
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Number slider widget is used to capture user feedback from a range of values",
      "!url": "https://docs.appsmith.com/widget-reference/circular-progress",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      value: "number",
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {
        setVisibility: {
          path: "isVisible",
          type: "boolean",
        },
        setDisabled: {
          path: "isDisabled",
          type: "boolean",
        },
        setValue: {
          path: "defaultValue",
          type: "number",
          accessor: "value",
        },
      },
    };
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

  static getDefaultPropertiesMap(): Record<string, string> {
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

  getWidgetView() {
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
        labelTooltip={this.props.labelTooltip}
        labelWidth={this.props.labelComponentWidth}
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
}

export default NumberSliderWidget;
