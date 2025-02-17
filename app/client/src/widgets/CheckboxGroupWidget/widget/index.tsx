import { Alignment } from "@blueprintjs/core";
import {
  CheckboxGroupAlignmentTypes,
  LabelPosition,
} from "components/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { TextSize } from "constants/WidgetConstants";
import type { ValidationResponse } from "constants/WidgetValidation";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { EvaluationSubstitutionType } from "ee/entities/DataTree/types";
import { compact, xor } from "lodash";
import { default as React } from "react";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import type { DerivedPropertiesMap } from "WidgetProvider/factory";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import {
  isAutoHeightEnabledForWidget,
  DefaultAutocompleteDefinitions,
  isCompactMode,
} from "widgets/WidgetUtils";
import CheckboxGroupComponent from "../component";
import type { OptionProps, SelectAllState } from "../constants";
import { SelectAllStates } from "../constants";
import { isAutoLayout } from "layoutSystems/autolayout/utils/flexWidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import { FlexVerticalAlignment } from "layoutSystems/common/utils/constants";

export function defaultSelectedValuesValidation(
  value: unknown,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any,
): ValidationResponse {
  let values: string[] = [];
  const options: OptionProps[] = props.options || [];

  if (typeof value === "string") {
    try {
      values = JSON.parse(value);
      values = values.filter((value: string) =>
        options.some((option: OptionProps) => option.value === value),
      );

      if (!Array.isArray(values)) {
        throw new Error();
      }
    } catch {
      values = value.length ? value.split(",") : [];

      if (values.length > 0) {
        values = values.map((_v: string) => _v.trim());
      }
    }
  }

  if (Array.isArray(value)) {
    values = Array.from(new Set(value));
  }

  return {
    isValid: true,
    parsed: values,
  };
}

class CheckboxGroupWidget extends BaseWidget<
  CheckboxGroupWidgetProps,
  WidgetState
> {
  static type = "CHECKBOX_GROUP_WIDGET";

  static getConfig() {
    return {
      name: "Checkbox Group",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.TOGGLES],
      needsMeta: true,
    };
  }

  static getDefaults() {
    return {
      rows: 6,
      columns: 23,
      animateLoading: true,
      labelTextSize: "0.875rem",
      options: [
        { label: "Blue", value: "BLUE" },
        { label: "Green", value: "GREEN" },
        { label: "Red", value: "RED" },
      ],
      defaultSelectedValues: ["BLUE"],
      isDisabled: false,
      isInline: true,
      isRequired: false,
      isVisible: true,
      labelText: "Label",
      labelPosition: LabelPosition.Top,
      labelAlignment: Alignment.LEFT,
      labelWidth: 5,
      widgetName: "CheckboxGroup",
      version: 2,
      flexVerticalAlignment: FlexVerticalAlignment.Top,
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        sectionIndex: 3,
        active: true,
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      defaults: {
        columns: 14,
        rows: 7,
      },
      disabledPropsDefaults: {
        labelPosition: LabelPosition.Top,
      },
      autoDimension: {
        height: true,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "240px",
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
        minWidth: { base: "240px" },
      },
    };
  }

  static getDependencyMap(): Record<string, string[]> {
    return {
      defaultSelectedValues: ["options"],
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Checkbox group widget allows users to easily configure multiple checkboxes together.",
      "!url": "https://docs.appsmith.com/widget-reference/checkbox-group",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      isDisabled: "bool",
      isValid: "bool",
      options: "[$__dropdownOption__$]",
      selectedValues: "[string]",
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText: "Displays a list of unique checkbox options",
            propertyName: "options",
            label: "Options",
            controlType: "OPTION_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                default: [],
                unique: ["value"],
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    required: true,
                    allowedKeys: [
                      {
                        name: "label",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                          required: true,
                        },
                      },
                      {
                        name: "value",
                        type: ValidationTypes.TEXT,
                        params: {
                          default: "",
                        },
                      },
                    ],
                  },
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Sets the values of the options checked by default",
            propertyName: "defaultSelectedValues",
            label: "Default selected values",
            placeholderText: '["apple", "orange"]',
            controlType: "INPUT_TEXT",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultSelectedValuesValidation,
                expected: {
                  type: "String or Array<string>",
                  example: `apple | ["apple", "orange"]`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
          },
        ],
      },
      {
        sectionName: "Label",
        children: [
          {
            helpText: "Sets the label text of the widget",
            propertyName: "labelText",
            label: "Text",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter label text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label position of the widget",
            propertyName: "labelPosition",
            label: "Position",
            controlType: "ICON_TABS",
            fullWidth: true,
            hidden: isAutoLayout,
            options: [
              { label: "Auto", value: LabelPosition.Auto },
              { label: "Left", value: LabelPosition.Left },
              { label: "Top", value: LabelPosition.Top },
            ],
            defaultValue: LabelPosition.Top,
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets the label alignment of the widget",
            propertyName: "labelAlignment",
            label: "Alignment",
            controlType: "LABEL_ALIGNMENT_OPTIONS",
            fullWidth: false,
            options: [
              {
                startIcon: "align-left",
                value: Alignment.LEFT,
              },
              {
                startIcon: "align-right",
                value: Alignment.RIGHT,
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
            hidden: (props: CheckboxGroupWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
          {
            helpText:
              "Sets the label width of the widget as the number of columns",
            propertyName: "labelWidth",
            label: "Width (in columns)",
            controlType: "NUMERIC_INPUT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            min: 0,
            validation: {
              type: ValidationTypes.NUMBER,
              params: {
                natural: true,
              },
            },
            hidden: (props: CheckboxGroupWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
        ],
      },
      {
        sectionName: "Validations",
        children: [
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            helpText: "Show help text or details about current input",
            propertyName: "labelTooltip",
            label: "Tooltip",
            controlType: "INPUT_TEXT",
            placeholderText: "Value must be atleast 6 chars",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables input to this widget",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isInline",
            label: "Inline",
            controlType: "SWITCH",
            helpText: "Displays the checkboxes horizontally",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isSelectAll",
            label: "Select all options",
            controlType: "SWITCH",
            helpText: "Controls whether select all option is shown",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "animateLoading",
            label: "Animate loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when the check state is changed",
            propertyName: "onSelectionChange",
            label: "onSelectionChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "Label styles",
        children: [
          {
            propertyName: "labelTextColor",
            label: "Font color",
            helpText: "Control the color of the label associated",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelTextSize",
            label: "Font size",
            helpText: "Control the font size of the label associated",
            controlType: "DROP_DOWN",
            defaultValue: "0.875rem",
            options: [
              {
                label: "S",
                value: "0.875rem",
                subText: "0.875rem",
              },
              {
                label: "M",
                value: "1rem",
                subText: "1rem",
              },
              {
                label: "L",
                value: "1.25rem",
                subText: "1.25rem",
              },
              {
                label: "XL",
                value: "1.875rem",
                subText: "1.875rem",
              },
              {
                label: "XXL",
                value: "3rem",
                subText: "3rem",
              },
              {
                label: "3XL",
                value: "3.75rem",
                subText: "3.75rem",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            propertyName: "labelStyle",
            label: "Emphasis",
            helpText: "Control if the label should be bold or italics",
            controlType: "BUTTON_GROUP",
            options: [
              {
                icon: "text-bold",
                value: "BOLD",
              },
              {
                icon: "text-italic",
                value: "ITALIC",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            propertyName: "optionAlignment",
            label: "Alignment",
            controlType: "DROP_DOWN",
            helpText: "Sets alignment between options.",
            options: [
              {
                label: "None",
                value: CheckboxGroupAlignmentTypes.NONE,
              },
              {
                label: "Start",
                value: CheckboxGroupAlignmentTypes.START,
              },
              {
                label: "End",
                value: CheckboxGroupAlignmentTypes.END,
              },
              {
                label: "Center",
                value: CheckboxGroupAlignmentTypes.CENTER,
              },
              {
                label: "Between",
                value: CheckboxGroupAlignmentTypes.SPACE_BETWEEN,
              },
              {
                label: "Around",
                value: CheckboxGroupAlignmentTypes.SPACE_AROUND,
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  CheckboxGroupAlignmentTypes.NONE,
                  CheckboxGroupAlignmentTypes.START,
                  CheckboxGroupAlignmentTypes.END,
                  CheckboxGroupAlignmentTypes.CENTER,
                  CheckboxGroupAlignmentTypes.SPACE_BETWEEN,
                  CheckboxGroupAlignmentTypes.SPACE_AROUND,
                ],
              },
            },
          },
        ],
      },
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "accentColor",
            helpText: "Sets the checked state color of the checkbox",
            label: "Accent color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border radius",
            helpText:
              "Rounds the corners of the icon button's outer border edge",
            controlType: "BORDER_RADIUS_OPTIONS",

            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      selectedValues: "defaultSelectedValues",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      selectedValues: undefined,
      isDirty: false,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      isValid: `{{ this.isRequired ? !!this.selectedValues.length : true }}`,
      value: `{{this.selectedValues}}`,
    };
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
    };
  }

  componentDidUpdate(prevProps: CheckboxGroupWidgetProps) {
    const validSelectedValues = prevProps.selectedValues.filter(
      (value: string) =>
        prevProps.options.some((option) => option.value === value),
    );

    if (validSelectedValues.length !== prevProps.selectedValues.length) {
      this.props.updateWidgetMetaProperty(
        "selectedValues",
        validSelectedValues,
      );
    }

    // Reset isDirty to false whenever defaultSelectedValues changes
    if (
      xor(this.props.defaultSelectedValues, prevProps.defaultSelectedValues)
        .length > 0 &&
      this.props.isDirty
    ) {
      this.props.updateWidgetMetaProperty("isDirty", false);
    }
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
        setRequired: {
          path: "isRequired",
          type: "boolean",
        },
        setSelectedOptions: {
          path: "defaultSelectedValues",
          type: "array",
          accessor: "selectedValues",
        },
      },
    };
  }

  getWidgetView() {
    const { componentHeight } = this.props;

    return (
      <CheckboxGroupComponent
        accentColor={this.props.accentColor}
        borderRadius={this.props.borderRadius}
        compactMode={isCompactMode(componentHeight)}
        isDisabled={this.props.isDisabled}
        isDynamicHeightEnabled={isAutoHeightEnabledForWidget(this.props)}
        isInline={this.props.isInline}
        isRequired={this.props.isRequired}
        isSelectAll={this.props.isSelectAll}
        isValid={this.props.isValid}
        key={this.props.widgetId}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelTooltip={this.props.labelTooltip}
        labelWidth={this.props.labelComponentWidth}
        minWidth={this.props.minWidth}
        onChange={this.handleCheckboxChange}
        onSelectAllChange={this.handleSelectAllChange}
        optionAlignment={this.props.optionAlignment}
        options={compact(this.props.options)}
        selectedValues={this.props.selectedValues || []}
        widgetId={this.props.widgetId}
      />
    );
  }

  private handleCheckboxChange = (value: string) => {
    return (event: React.FormEvent<HTMLElement>) => {
      let { selectedValues = [] } = this.props;
      const isChecked = (event.target as HTMLInputElement).checked;

      if (isChecked) {
        selectedValues = [...selectedValues, value];
      } else {
        selectedValues = selectedValues.filter(
          (item: string) => item !== value,
        );
      }

      // Update isDirty to true whenever value changes
      if (!this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", true);
      }

      this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
        triggerPropertyName: "onSelectionChange",
        dynamicString: this.props.onSelectionChange,
        event: {
          type: EventType.ON_CHECKBOX_GROUP_SELECTION_CHANGE,
        },
      });
    };
  };

  private handleSelectAllChange = (state: SelectAllState) => {
    return () => {
      let { selectedValues = [] } = this.props;

      switch (state) {
        case SelectAllStates.UNCHECKED:
          selectedValues = this.props.options.map((option) => option.value);
          break;

        default:
          selectedValues = [];
          break;
      }

      if (!this.props.isDirty) {
        this.props.updateWidgetMetaProperty("isDirty", true);
      }

      this.props.updateWidgetMetaProperty("selectedValues", selectedValues, {
        triggerPropertyName: "onSelectionChange",
        dynamicString: this.props.onSelectionChange,
        event: {
          type: EventType.ON_CHECKBOX_GROUP_SELECTION_CHANGE,
        },
      });
    };
  };
}

export interface CheckboxGroupWidgetProps extends WidgetProps {
  options: OptionProps[];
  isInline: boolean;
  isSelectAll?: boolean;
  isRequired?: boolean;
  isDisabled: boolean;
  isValid?: boolean;
  onCheckChanged?: string;
  optionAlignment?: string;
  labelText?: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  labelTextColor?: string;
  labelTextSize?: TextSize;
  labelStyle?: string;
  accentColor: string;
  borderRadius: string;
  labelComponentWidth?: number;
}

export default CheckboxGroupWidget;
