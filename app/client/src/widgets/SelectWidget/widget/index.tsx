import { Alignment } from "@blueprintjs/core";
import { LabelPosition } from "components/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";
import equal from "fast-deep-equal/es6";
import { findIndex, isArray, isNil, isNumber, isString } from "lodash";
import React from "react";
import { AutocompleteDataType } from "utils/autocomplete/AutocompleteDataType";
import { isAutoLayout } from "layoutSystems/autolayout/utils/flexWidgetUtils";
import { MinimumPopupWidthInPercentage } from "WidgetProvider/constants";
import {
  isAutoHeightEnabledForWidget,
  DefaultAutocompleteDefinitions,
  isCompactMode,
} from "widgets/WidgetUtils";
import type { WidgetProps, WidgetState } from "../../BaseWidget";
import BaseWidget from "../../BaseWidget";
import SelectComponent from "../component";
import type { DropdownOption } from "../constants";
import {
  getOptionLabelValueExpressionPrefix,
  optionLabelValueExpressionSuffix,
} from "../constants";
import {
  defaultValueExpressionPrefix,
  getDefaultValueExpressionSuffix,
} from "../constants";
import derivedPropertyFns from "./derived";
import { parseDerivedProperties } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import {
  defaultOptionValueValidation,
  labelKeyValidation,
  getLabelValueAdditionalAutocompleteData,
  getLabelValueKeyOptions,
  valueKeyValidation,
} from "./propertyUtils";
import type {
  WidgetQueryConfig,
  WidgetQueryGenerationFormConfig,
} from "WidgetQueryGenerators/types";
import { DynamicHeight } from "utils/WidgetFeatures";
import { WIDGET_TAGS, layoutConfigurations } from "constants/WidgetConstants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type {
  SnipingModeProperty,
  PropertyUpdates,
} from "WidgetProvider/constants";

import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { DynamicPath } from "utils/DynamicBindingUtils";

class SelectWidget extends BaseWidget<SelectWidgetProps, WidgetState> {
  constructor(props: SelectWidgetProps) {
    super(props);
  }
  static type = "SELECT_WIDGET";

  static getConfig() {
    return {
      name: "Select",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.SUGGESTED_WIDGETS, WIDGET_TAGS.SELECT],
      needsMeta: true,
      searchTags: ["dropdown"],
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        sectionIndex: 4,
        defaultValue: DynamicHeight.FIXED,
        active: true,
      },
    };
  }

  static getDefaults() {
    return {
      rows: 7,
      columns: 20,
      placeholderText: "Select option",
      labelText: "Label",
      labelPosition: LabelPosition.Top,
      labelAlignment: Alignment.LEFT,
      labelWidth: 5,
      sourceData: JSON.stringify(
        [
          { name: "Blue", code: "BLUE" },
          { name: "Green", code: "GREEN" },
          { name: "Red", code: "RED" },
        ],
        null,
        2,
      ),
      optionLabel: "name",
      optionValue: "code",
      serverSideFiltering: false,
      widgetName: "Select",
      defaultOptionValue: "GREEN",
      version: 1,
      isFilterable: true,
      isRequired: false,
      isDisabled: false,
      animateLoading: true,
      labelTextSize: "0.875rem",
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      dynamicPropertyPathList: [{ key: "sourceData" }],
    };
  }

  static getMethods() {
    return {
      getSnipingModeUpdates: (
        propValueMap: SnipingModeProperty,
      ): PropertyUpdates[] => {
        return [
          {
            propertyPath: "sourceData",
            propertyValue: propValueMap.data,
            isDynamicPropertyPath: true,
          },
        ];
      },
      getQueryGenerationConfig(widget: WidgetProps) {
        return {
          select: {
            where: `${widget.widgetName}.filterText`,
          },
        };
      },
      getPropertyUpdatesForQueryBinding(
        queryConfig: WidgetQueryConfig,
        widget: WidgetProps,
        formConfig: WidgetQueryGenerationFormConfig,
      ) {
        let modify;

        const dynamicPropertyPathList: DynamicPath[] = [
          ...(widget.dynamicPropertyPathList || []),
        ];

        if (queryConfig.select) {
          modify = {
            sourceData: queryConfig.select.data,
            optionLabel: formConfig.aliases.find((d) => d.name === "label")
              ?.alias,
            optionValue: formConfig.aliases.find((d) => d.name === "value")
              ?.alias,
            defaultOptionValue: "",
            serverSideFiltering: true,
            onFilterUpdate: queryConfig.select.run,
          };

          dynamicPropertyPathList.push({ key: "sourceData" });
        }

        return {
          modify,
          dynamicUpdates: {
            dynamicPropertyPathList,
          },
        };
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      disabledPropsDefaults: {
        labelPosition: LabelPosition.Top,
        labelTextSize: "0.875rem",
      },
      defaults: {
        rows: 6.6,
      },
      autoDimension: {
        height: true,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: () => {
            return {
              minWidth: "120px",
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
        minHeight: {},
        minWidth: { base: "120px" },
      },
    };
  }

  static getDependencyMap(): Record<string, string[]> {
    return {
      optionLabel: ["sourceData"],
      optionValue: ["sourceData"],
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "Select is used to capture user input/s from a specified list of permitted inputs. A Select can capture a single choice",
      "!url": "https://docs.appsmith.com/widget-reference/dropdown",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      filterText: {
        "!type": "string",
        "!doc": "The filter text for Server side filtering",
      },
      selectedOptionValue: {
        "!type": "string",
        "!doc": "The value selected in a single select dropdown",
        "!url": "https://docs.appsmith.com/widget-reference/dropdown",
      },
      selectedOptionLabel: {
        "!type": "string",
        "!doc": "The selected option label in a single select dropdown",
        "!url": "https://docs.appsmith.com/widget-reference/dropdown",
      },
      isDisabled: "bool",
      isValid: "bool",
      isDirty: "bool",
      options: "[$__dropdownOption__$]",
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText:
              "Takes in an array of objects to display options. Bind data from an API using {{}}",
            propertyName: "sourceData",
            label: "Source Data",
            controlType: "ONE_CLICK_BINDING_CONTROL",
            controlConfig: {
              aliases: [
                {
                  name: "label",
                  isSearcheable: true,
                  isRequired: true,
                },
                {
                  name: "value",
                  isRequired: true,
                },
              ],
              sampleData: JSON.stringify(
                [
                  { name: "Blue", code: "BLUE" },
                  { name: "Green", code: "GREEN" },
                  { name: "Red", code: "RED" },
                ],
                null,
                2,
              ),
            },
            isJSConvertible: true,
            placeholderText: '[{ "label": "label1", "value": "value1" }]',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.ARRAY,
              params: {
                children: {
                  type: ValidationTypes.OBJECT,
                  params: {
                    required: true,
                  },
                },
              },
            },
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText:
              "Choose or set a field from source data as the display label",
            propertyName: "optionLabel",
            label: "Label key",
            controlType: "DROP_DOWN",
            customJSControl: "WRAPPED_CODE_EDITOR",
            controlConfig: {
              wrapperCode: {
                prefix: getOptionLabelValueExpressionPrefix,
                suffix: optionLabelValueExpressionSuffix,
              },
            },
            placeholderText: "",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: true,
            evaluatedDependencies: ["sourceData"],
            options: getLabelValueKeyOptions,
            alwaysShowSelected: true,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: labelKeyValidation,
                expected: {
                  type: "String or Array<string>",
                  example: `color | ["blue", "green"]`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            additionalAutoComplete: getLabelValueAdditionalAutocompleteData,
          },
          {
            helpText: "Choose or set a field from source data as the value",
            propertyName: "optionValue",
            label: "Value key",
            controlType: "DROP_DOWN",
            customJSControl: "WRAPPED_CODE_EDITOR",
            controlConfig: {
              wrapperCode: {
                prefix: getOptionLabelValueExpressionPrefix,
                suffix: optionLabelValueExpressionSuffix,
              },
            },
            placeholderText: "",
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: true,
            evaluatedDependencies: ["sourceData"],
            options: getLabelValueKeyOptions,
            alwaysShowSelected: true,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: valueKeyValidation,
                expected: {
                  type: "String or Array<string | number | boolean>",
                  example: `color | [1, "orange"]`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            additionalAutoComplete: getLabelValueAdditionalAutocompleteData,
          },
          {
            helpText: "Selects the option with value by default",
            propertyName: "defaultOptionValue",
            label: "Default selected value",
            controlType: "WRAPPED_CODE_EDITOR",
            controlConfig: {
              wrapperCode: {
                prefix: defaultValueExpressionPrefix,
                suffix: getDefaultValueExpressionSuffix,
              },
            },
            placeholderText: '{ "label": "label1", "value": "value1" }',
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.FUNCTION,
              params: {
                fn: defaultOptionValueValidation,
                expected: {
                  type: 'value1 or { "label": "label1", "value": "value1" }',
                  example: `value1 | { "label": "label1", "value": "value1" }`,
                  autocompleteDataType: AutocompleteDataType.STRING,
                },
              },
            },
            dependencies: ["serverSideFiltering", "options"],
            helperText: (
              <div className="leading-5" style={{ marginTop: "10px" }}>
                Make sure the default value is present in the source data to
                have it selected by default in the UI.
              </div>
            ),
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
            options: [
              { label: "Left", value: LabelPosition.Left },
              { label: "Top", value: LabelPosition.Top },
              { label: "Auto", value: LabelPosition.Auto },
            ],
            hidden: isAutoLayout,
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
            hidden: (props: SelectWidgetProps) =>
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
            hidden: (props: SelectWidgetProps) =>
              props.labelPosition !== LabelPosition.Left,
            dependencies: ["labelPosition"],
          },
        ],
      },
      {
        sectionName: "Search & filters",
        children: [
          {
            propertyName: "isFilterable",
            label: "Allow searching",
            helpText: "Makes the dropdown list filterable",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Enables server side filtering of the data",
            propertyName: "serverSideFiltering",
            label: "Server side filtering",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            helpText: "Trigger an action on change of filterText",
            hidden: (props: SelectWidgetProps) => !props.serverSideFiltering,
            dependencies: ["serverSideFiltering"],
            propertyName: "onFilterUpdate",
            label: "onFilterUpdate",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
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
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
          {
            helpText: "Show help text or details about current selection",
            propertyName: "labelTooltip",
            label: "Tooltip",
            controlType: "INPUT_TEXT",
            placeholderText: "Add tooltip text here",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Sets a Placeholder Text",
            propertyName: "placeholderText",
            label: "Placeholder",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter placeholder text",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
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
          {
            propertyName: "rtl",
            label: "Enable RTL",
            helpText: "Enables right to left text direction",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
            hidden: () => {
              return !super.getFeatureFlag(
                FEATURE_FLAG.license_widget_rtl_support_enabled,
              );
            },
          },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when a user selects an option",
            propertyName: "onOptionChange",
            label: "onOptionChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "when the dropdown opens",
            propertyName: "onDropdownOpen",
            label: "onDropdownOpen",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "when the dropdown closes",
            propertyName: "onDropdownClose",
            label: "onDropdownClose",
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
            hidden: isAutoLayout,
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
          {
            propertyName: "boxShadow",
            label: "Box shadow",
            helpText:
              "Enables you to cast a drop shadow from the frame of the widget",
            controlType: "BOX_SHADOW_OPTIONS",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
    ];
  }

  static getStylesheetConfig(): Stylesheet {
    return {
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      value: "defaultOptionValue",
      label: "defaultOptionValue",
      filterText: "",
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getMetaPropertiesMap(): Record<string, any> {
    return {
      value: undefined,
      label: undefined,
      filterText: "",
      isDirty: false,
    };
  }

  // https://github.com/appsmithorg/appsmith/issues/13664#issuecomment-1120814337
  static getDerivedPropertiesMap() {
    const parsedDerivedProperties = parseDerivedProperties(derivedPropertyFns);

    return {
      options: `{{(()=>{${parsedDerivedProperties.getOptions}})()}}`,
      isValid: `{{(()=>{${parsedDerivedProperties.getIsValid}})()}}`,
      selectedOptionValue: `{{(()=>{${parsedDerivedProperties.getSelectedOptionValue}})()}}`,

      selectedOptionLabel: `{{(()=>{${parsedDerivedProperties.getSelectedOptionLabel}})()}}`,
    };
  }

  componentDidMount() {
    super.componentDidMount();
  }

  componentDidUpdate(prevProps: SelectWidgetProps): void {
    // Reset isDirty to false if defaultOptionValue changes
    if (
      !equal(this.props.defaultOptionValue, prevProps.defaultOptionValue) &&
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
        setOptions: {
          path: "options",
          type: "array",
        },
        setSelectedOption: {
          path: "defaultOptionValue",
          type: "string",
          accessor: "selectedOptionValue",
        },
      },
    };
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isStringOrNumber = (value: any): value is string | number =>
    isString(value) || isNumber(value);

  getWidgetView() {
    const options = isArray(this.props.options) ? this.props.options : [];
    const isInvalid =
      "isValid" in this.props && !this.props.isValid && !!this.props.isDirty;
    const dropDownWidth =
      (MinimumPopupWidthInPercentage / 100) *
      (this.props.mainCanvasWidth ?? layoutConfigurations.MOBILE.maxWidth);

    const selectedIndex = findIndex(this.props.options, {
      value: this.props.selectedOptionValue,
    });
    const { componentHeight, componentWidth } = this.props;

    return (
      <SelectComponent
        accentColor={this.props.accentColor}
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        compactMode={isCompactMode(componentHeight)}
        disabled={this.props.isDisabled}
        dropDownWidth={dropDownWidth}
        filterText={this.props.filterText}
        hasError={isInvalid}
        height={componentHeight}
        isDynamicHeightEnabled={isAutoHeightEnabledForWidget(this.props)}
        isFilterable={this.props.isFilterable}
        isLoading={this.props.isLoading}
        isRequired={this.props.isRequired}
        isValid={this.props.isValid}
        label={this.props.selectedOptionLabel}
        labelAlignment={this.props.labelAlignment}
        labelPosition={this.props.labelPosition}
        labelStyle={this.props.labelStyle}
        labelText={this.props.labelText}
        labelTextColor={this.props.labelTextColor}
        labelTextSize={this.props.labelTextSize}
        labelTooltip={this.props.labelTooltip}
        labelWidth={this.props.labelComponentWidth}
        onDropdownClose={this.onDropdownClose}
        onDropdownOpen={this.onDropdownOpen}
        onFilterChange={this.onFilterChange}
        onOptionSelected={this.onOptionSelected}
        options={options}
        placeholder={this.props.placeholderText}
        resetFilterTextOnClose={!this.props.serverSideFiltering}
        rtl={this.props.rtl}
        selectedIndex={selectedIndex > -1 ? selectedIndex : undefined}
        serverSideFiltering={this.props.serverSideFiltering}
        value={this.props.selectedOptionValue}
        widgetId={this.props.widgetId}
        width={componentWidth}
      />
    );
  }

  onOptionSelected = (selectedOption: DropdownOption) => {
    let isChanged = true;

    // Check if the value has changed. If no option
    // selected till now, there is a change
    if (!isNil(this.props.selectedOptionValue)) {
      isChanged = this.props.selectedOptionValue !== selectedOption.value;
    }

    const { commitBatchMetaUpdates, pushBatchMetaUpdates } = this.props;

    if (isChanged) {
      if (!this.props.isDirty) {
        pushBatchMetaUpdates("isDirty", true);
      }

      pushBatchMetaUpdates("label", selectedOption.label ?? "");

      pushBatchMetaUpdates("value", selectedOption.value ?? "", {
        triggerPropertyName: "onOptionChange",
        dynamicString: this.props.onOptionChange,
        event: {
          type: EventType.ON_OPTION_CHANGE,
        },
      });
    }

    // When Label changes but value doesnt change, Applies to serverside Filtering
    if (!isChanged && this.props.selectedOptionLabel !== selectedOption.label) {
      pushBatchMetaUpdates("label", selectedOption.label ?? "");
    }

    commitBatchMetaUpdates();
  };

  onFilterChange = (value: string) => {
    this.props.updateWidgetMetaProperty("filterText", value);

    if (this.props.onFilterUpdate && this.props.serverSideFiltering) {
      super.executeAction({
        triggerPropertyName: "onFilterUpdate",
        dynamicString: this.props.onFilterUpdate,
        event: {
          type: EventType.ON_FILTER_UPDATE,
        },
      });
    }
  };

  onDropdownOpen = () => {
    if (this.props.onDropdownOpen) {
      super.executeAction({
        triggerPropertyName: "onDropdownOpen",
        dynamicString: this.props.onDropdownOpen,
        event: {
          type: EventType.ON_DROPDOWN_OPEN,
        },
      });
    }
  };

  onDropdownClose = () => {
    if (this.props.onDropdownClose) {
      super.executeAction({
        triggerPropertyName: "onDropdownClose",
        dynamicString: this.props.onDropdownClose,
        event: {
          type: EventType.ON_DROPDOWN_CLOSE,
        },
      });
    }
  };
}

export interface SelectWidgetProps extends WidgetProps {
  placeholderText?: string;
  labelText: string;
  labelPosition?: LabelPosition;
  labelAlignment?: Alignment;
  labelWidth?: number;
  selectedIndex?: number;
  options?: DropdownOption[];
  onOptionChange?: string;
  onDropdownOpen?: string;
  onDropdownClose?: string;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultOptionValue?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  label?: any;
  isRequired: boolean;
  isFilterable: boolean;
  selectedOptionLabel: string;
  serverSideFiltering: boolean;
  onFilterUpdate: string;
  isDirty?: boolean;
  filterText: string;
  labelComponentWidth?: number;
  rtl?: boolean;
}

export default SelectWidget;
