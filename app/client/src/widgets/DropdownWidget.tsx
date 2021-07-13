import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import DropDownComponent from "components/designSystems/blueprint/DropdownComponent";
import _ from "lodash";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import { Intent as BlueprintIntent } from "@blueprintjs/core";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { IconName } from "@blueprintjs/icons";
import { EvaluationSubstitutionType } from "entities/DataTree/dataTreeFactory";

class DropdownWidget extends BaseWidget<DropdownWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText:
              "Allows users to select a single option. Values must be unique",
            propertyName: "options",
            label: "Options",
            controlType: "INPUT_TEXT",
            placeholderText: 'Enter [{"label": "label1", "value": "value2"}]',
            isBindProperty: true,
            isTriggerProperty: false,
            isJSConvertible: true,
            validation: VALIDATION_TYPES.OPTIONS_DATA,
            evaluationSubstitutionType:
              EvaluationSubstitutionType.SMART_SUBSTITUTE,
          },
          {
            helpText: "Selects the option with value by default",
            propertyName: "defaultOptionValue",
            label: "Default Option",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter option value",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.DEFAULT_OPTION_VALUE,
          },
          {
            propertyName: "isFilterable",
            label: "Filterable",
            helpText: "Makes the dropdown list filterable",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isRequired",
            label: "Required",
            helpText: "Makes input to the widget mandatory",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            helpText: "Disables input to this widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
          {
            helpText: "Controls the Remote Data/ Server Side Filtering",
            propertyName: "serverSideFiltering",
            label: "Server Side Filtering",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.BOOLEAN,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when a user selects an option",
            propertyName: "onOptionChange",
            label: "onOptionChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Filter options using filterText",
            hidden: (props: DropdownWidgetProps) => !props.serverSideFiltering,
            propertyName: "onFilterUpdate",
            label: "onFilterUpdate",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap() {
    return {
      isValid: `{{this.isRequired  ? !!this.selectedOption : true}}`,
      selectedOption: `{{  _.find(this.options, { value:  this.defaultValue }) }}`,
      selectedIndex: `{{ _.findIndex(this.options, { value: this.selectedOption.value } ) }}`,
      value: `{{  this.defaultValue }}`,
      selectedOptionLabel: `{{(()=>{const index = _.findIndex(this.options, { value: this.defaultValue }); return this.options[index]?.label; })()}}`,
      selectedOptionValue: `{{(()=>{const index = _.findIndex(this.options, { value: this.defaultValue }); return this.options[index]?.value; })()}}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      defaultValue: "defaultOptionValue",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      defaultValue: undefined,
    };
  }

  getPageView() {
    const options = _.isArray(this.props.options) ? this.props.options : [];
    const selectedIndex = _.findIndex(this.props.options, {
      value: this.props.defaultValue,
    });
    const { componentHeight, componentWidth } = this.getComponentDimensions();
    return (
      <DropDownComponent
        disabled={this.props.isDisabled}
        height={componentHeight}
        isFilterable={this.props.isFilterable}
        isLoading={this.props.isLoading}
        label={`${this.props.label}`}
        onFilterChange={this.onFilterChange}
        onOptionSelected={this.onOptionSelected}
        options={options}
        placeholder={this.props.placeholderText}
        selectedIndex={selectedIndex > -1 ? selectedIndex : undefined}
        serverSideFiltering={this.props.serverSideFiltering}
        widgetId={this.props.widgetId}
        width={componentWidth}
      />
    );
  }

  onOptionSelected = (selectedOption: DropdownOption) => {
    let isChanged = true;

    // Check if the value has changed. If no option
    // selected till now, there is a change
    if (this.props.selectedOption) {
      isChanged = !(this.props.selectedOption.value === selectedOption.value);
    }
    if (isChanged) {
      this.props.updateWidgetMetaProperty(
        "defaultValue",
        selectedOption.value,
        {
          triggerPropertyName: "onOptionChange",
          dynamicString: this.props.onOptionChange,
          event: {
            type: EventType.ON_OPTION_CHANGE,
          },
        },
      );
    }
  };

  onFilterChange = (value: string) => {
    this.props.updateWidgetMetaProperty("filterText", value);
    if (value.length) {
      super.executeAction({
        triggerPropertyName: "onFilterUpdate",
        dynamicString: this.props.onFilterUpdate,
        event: {
          type: EventType.ON_FILTER_UPDATE,
        },
      });
    }
  };

  getWidgetType(): WidgetType {
    return "DROP_DOWN_WIDGET";
  }
}

export interface DropdownOption {
  label: string;
  value: string;
  icon?: IconName;
  subText?: string;
  id?: string;
  onSelect?: (option: DropdownOption) => void;
  children?: DropdownOption[];
  intent?: BlueprintIntent;
}

export interface DropdownWidgetProps extends WidgetProps, WithMeta {
  placeholderText?: string;
  label?: string;
  selectedIndex?: number;
  selectedOption: DropdownOption;
  options?: DropdownOption[];
  onOptionChange?: string;
  defaultOptionValue?: string | string[];
  isRequired: boolean;
  isFilterable: boolean;
  defaultValue: string;
  selectedOptionLabel: string;
  serverSideFiltering: boolean;
  onFilterUpdate: string;
}

export default DropdownWidget;
export const ProfiledDropDownWidget = Sentry.withProfiler(
  withMeta(DropdownWidget),
);
