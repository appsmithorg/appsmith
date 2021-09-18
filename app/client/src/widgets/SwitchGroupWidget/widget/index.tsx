import React from "react";
import { Alignment } from "@blueprintjs/core";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import SwitchGroupComponent from "../component";

class SwitchGroupWidget extends BaseWidget<
  SwitchGroupWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "isDisabled",
            helpText: "Disables input to the widget",
            label: "Disabled",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isVisible",
            helpText: "Controls the visibility of the widget",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isInline",
            helpText:
              "Whether switches are to be displayed inline horizontally",
            label: "Inline",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Group Items",
        children: [
          {
            helpText: "Group items",
            propertyName: "groupItems",
            controlType: "ITEMS",
            label: "",
            isBindProperty: false,
            isTriggerProperty: false,
            panelConfig: {
              editableTitle: true,
              titlePropertyName: "label",
              panelIdPropertyName: "id",
              updateHook: (
                props: any,
                propertyPath: string,
                propertyValue: string,
              ) => {
                return [{ propertyPath, propertyValue }];
              },
              children: [
                {
                  sectionName: "General",
                  children: [
                    {
                      propertyName: "isDisabled",
                      helpText: "Disables input to the widget",
                      label: "Disabled",
                      controlType: "SWITCH",
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.BOOLEAN },
                    },
                    {
                      propertyName: "isVisible",
                      helpText: "Controls the visibility of the widget",
                      label: "Visible",
                      controlType: "SWITCH",
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.BOOLEAN },
                    },
                    {
                      propertyName: "label",
                      helpText: "Sets the label of an item",
                      label: "Label",
                      controlType: "INPUT_TEXT",
                      placeholderText: "Enter label",
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.TEXT },
                    },
                    {
                      propertyName: "value",
                      helpText: "Sets the value of an item",
                      label: "Value",
                      controlType: "INPUT_TEXT",
                      placeholderText: "Enter value",
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.TEXT },
                    },
                    {
                      propertyName: "alignIndicator",
                      helpText: "Sets the alignment of the indicator",
                      label: "Alignment",
                      controlType: "DROP_DOWN",
                      isBindProperty: true,
                      isTriggerProperty: false,
                      options: [
                        {
                          label: "Left",
                          value: Alignment.LEFT,
                        },
                        {
                          label: "Right",
                          value: Alignment.RIGHT,
                        },
                      ],
                    },

                    {
                      propertyName: "defaultChecked",
                      label: "Default State",
                      helpText:
                        "On / Off the Switch by default. Changes to the default selection update the widget state",
                      controlType: "SWITCH",
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.BOOLEAN },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText:
              "Triggers an action when a switch state inside the group is changed",
            propertyName: "onChange",
            label: "onChange",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      selectedValues: `{{
        function() {
          const itemsArray = Object.values(this.items);
          return itemsArray.reduce((acc, item) => {
            if ("checked" in item) {
              if (item.checked) {
                acc.push(item.value);
              }
              return acc;
            }
            if (item.defaultChecked) {
              acc.push(item.value);
            }
            return acc;
          }, []);
        }()
      }}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {
      items: "groupItems",
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      items: undefined,
    };
  }

  static getWidgetType(): string {
    return "SWITCH_GROUP_WIDGET";
  }

  componentDidUpdate(prevProps: SwitchGroupWidgetProps) {
    const prevItems = prevProps.groupItems;
    const items = { ...this.props.groupItems };

    let isStateChanged = false;
    const itemsArray = Object.values(items);

    isStateChanged = !itemsArray.every(
      (item) => item.defaultChecked === prevItems[item.id].defaultChecked,
    );

    if (isStateChanged) {
      for (const key in items) {
        delete items[key].checked;
      }
      this.props.updateWidgetMetaProperty("items", items);
    }
  }

  getPageView() {
    const {
      groupItems,
      isDisabled,
      isInline,
      parentRowSpace,
      selectedValues,
    } = this.props;

    return (
      <SwitchGroupComponent
        disabled={isDisabled}
        inline={isInline}
        items={groupItems}
        onChange={this.handleSwitchStateChange}
        rowSpace={parentRowSpace}
        selectedValues={selectedValues}
      />
    );
  }

  private handleSwitchStateChange = (id: string, value: boolean) => {
    const { items } = this.props;
    const updatedItems = {
      ...items,
      [id]: {
        ...items[id],
        checked: value,
      },
    };

    this.props.updateWidgetMetaProperty("items", updatedItems, {
      triggerPropertyName: "onChange",
      dynamicString: this.props.onChange,
      event: {
        type: EventType.ON_SWITCH_GROUP_CHANGE,
      },
    });
  };
}

export interface SwitchGroupWidgetProps extends WidgetProps {
  isDisabled?: boolean;
  isVisible?: boolean;
  isInline?: boolean;
  groupItems: Record<
    string,
    {
      widgetId: string;
      id: string;
      index: number;
      isVisible?: boolean;
      isDisabled?: boolean;
      label?: string;
      value: string;
      labelAlign?: Alignment;
      defaultChecked?: boolean;
      checked?: boolean;
      onChange?: string;
    }
  >;
}

export default SwitchGroupWidget;
