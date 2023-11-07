import * as React from "react";

import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { TAILWIND_COLORS } from "constants/ThemeConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import contentConfig from "./propertyConfig/contentConfig";
import styleConfig from "./propertyConfig/styleConfig";
import type { SliderComponentProps } from "../../NumberSliderWidget/component/Slider";
import SliderComponent from "../../NumberSliderWidget/component/Slider";
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

export interface SliderOption {
  label: string;
  value: string;
}

export interface CategorySliderWidgetProps
  extends WidgetProps,
    SliderComponentProps {
  /** Color from theme.colors */
  accentColor?: string;

  /** Slider Options  */
  options?: SliderOption[];

  /** defaultOption value */
  defaultOptionValue?: string;

  /** isDirty meta property */
  isDirty: boolean;

  /**  Selected Value */
  value: string | undefined;

  /** onChange action selector */
  onChange: string;
}

class CategorySliderWidget extends BaseWidget<
  CategorySliderWidgetProps,
  WidgetState
> {
  static type = "CATEGORY_SLIDER_WIDGET";

  static getConfig() {
    return {
      name: "Category Slider",
      needsMeta: true,
      searchTags: ["range"],
      iconSVG: IconSVG,
      tags: [WIDGET_TAGS.SLIDERS],
    };
  }

  static getDefaults() {
    return {
      options: [
        { label: "xs", value: "xs" },
        { label: "sm", value: "sm" },
        { label: "md", value: "md" },
        { label: "lg", value: "lg" },
        { label: "xl", value: "xl" },
      ],
      defaultOptionValue: "md",
      isVisible: true,
      isDisabled: false,
      showMarksLabel: true,
      rows: 8,
      columns: 40,
      widgetName: "CategorySlider",
      shouldScroll: false,
      shouldTruncate: false,
      version: 1,
      animateLoading: true,
      labelText: "Size",
      labelPosition: LabelPosition.Top,
      labelAlignment: Alignment.LEFT,
      labelWidth: 5,
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

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Category slider widget is used to capture user feedback from a range of categories",
      "!url": "https://docs.appsmith.com/widget-reference/circular-progress",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      value: "string",
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
          path: "defaultOptionValue",
          type: "number",
          accessor: "value",
        },
      },
    };
  }

  componentDidUpdate(prevProps: CategorySliderWidgetProps) {
    /**
     * If you change the defaultOptionValue from the propertyPane
     * or say an input widget you are basically resetting the widget
     * therefore we reset the isDirty.
     */
    if (
      this.props.defaultOptionValue !== prevProps.defaultOptionValue &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      value: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, unknown> {
    return {
      value: undefined,
      isDirty: false,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
    };
  }

  getSliderOptions = () => {
    const options = this.props.options || [];
    /** get the stepSize - if we have 4 options stepSize is 25  */
    const stepSize = Math.round(100 / options.length);

    /**
     * For the marks we need Array<{ value: number, label: string }>
     * So we have sliderOptions matching its type.
     */
    const sliderOptions = options.map((option, index) => ({
      /**
       * create categories - if we have 4 options
       * value will be 25, 50, 75, 100
       */
      value: (index + 1) * stepSize,
      label: option.label,
      optionValue: option.value,
    }));

    return {
      sliderOptions,
      stepSize,
    };
  };

  onChangeEnd = (sliderValue: number) => {
    const { sliderOptions } = this.getSliderOptions();

    const selectedValue = sliderOptions.find(
      (option) => option.value === sliderValue,
    )?.optionValue;

    if (this.props.value !== selectedValue) {
      this.props.updateWidgetMetaProperty("value", selectedValue, {
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

  getWidgetView() {
    const { sliderOptions, stepSize } = this.getSliderOptions();

    const sliderValue = sliderOptions.find(
      (option) => option.optionValue === this.props.value,
    )?.value;

    return (
      <SliderComponent
        color={this.props.accentColor || TAILWIND_COLORS.green["600"]}
        disabled={this.props.isDisabled || sliderOptions.length === 0}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelTooltip={this.props.labelTooltip}
        labelWidth={this.props.labelComponentWidth}
        loading={this.props.isLoading}
        marks={sliderOptions}
        max={stepSize * sliderOptions.length}
        min={stepSize}
        name={this.props.widgetName}
        onChangeEnd={this.onChangeEnd}
        showMarksLabel={this.props.showMarksLabel || sliderOptions.length === 0}
        sliderSize={this.props.sliderSize || "m"}
        sliderTooltip={(val: number) =>
          sliderOptions.find((option) => option.value === val)?.label || ""
        }
        sliderValue={sliderValue || stepSize}
        step={stepSize}
        tooltipAlwaysOn={false}
      />
    );
  }
}

export default CategorySliderWidget;
