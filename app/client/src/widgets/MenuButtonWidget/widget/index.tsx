import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import MenuButtonComponent from "../component";
import { ValidationTypes } from "constants/WidgetValidation";
import { Alignment } from "@blueprintjs/core";
import {
  ButtonBorderRadius,
  ButtonVariant,
  ButtonVariantTypes,
  ButtonPlacementTypes,
  ButtonPlacement,
} from "components/constants";
import { IconName } from "@blueprintjs/icons";
import { MinimumPopupRows } from "widgets/constants";
export interface MenuButtonWidgetProps extends WidgetProps {
  label?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isCompact?: boolean;
  menuItems: Record<
    string,
    {
      widgetId: string;
      id: string;
      index: number;
      isVisible?: boolean;
      isDisabled?: boolean;
      label?: string;
      backgroundColor?: string;
      textColor?: string;
      iconName?: IconName;
      iconColor?: string;
      iconAlign?: Alignment;
      onClick?: string;
    }
  >;
  menuVariant?: ButtonVariant;
  menuColor?: string;
  borderRadius: ButtonBorderRadius;
  boxShadow?: string;
  iconName?: IconName;
  iconAlign?: Alignment;
  placement?: ButtonPlacement;
}

class MenuButtonWidget extends BaseWidget<MenuButtonWidgetProps, WidgetState> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Basic",
        children: [
          {
            propertyName: "label",
            helpText: "Sets the label of a menu",
            label: "Label",
            controlType: "INPUT_TEXT",
            placeholderText: "Open",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
          {
            helpText: "Menu items",
            propertyName: "menuItems",
            controlType: "MENU_ITEMS",
            label: "Menu Items",
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
                return [
                  {
                    propertyPath,
                    propertyValue,
                  },
                ];
              },
              contentChildren: [
                {
                  sectionName: "Basic",
                  children: [
                    {
                      propertyName: "label",
                      helpText: "Sets the label of a menu item",
                      label: "Label",
                      controlType: "INPUT_TEXT",
                      placeholderText: "Download",
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.TEXT },
                    },
                    {
                      helpText:
                        "Triggers an action when the menu item is clicked",
                      propertyName: "onClick",
                      label: "onClick",
                      controlType: "ACTION_SELECTOR",
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: true,
                    },
                  ],
                },
                {
                  sectionName: "General",
                  children: [
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
                      propertyName: "isDisabled",
                      helpText: "Disables input to the widget",
                      label: "Disabled",
                      controlType: "SWITCH",
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.BOOLEAN },
                    },
                  ],
                },
              ],
              styleChildren: [
                {
                  sectionName: "Icon",
                  children: [
                    {
                      propertyName: "iconName",
                      label: "Icon",
                      helpText: "Sets the icon to be used for a menu item",
                      controlType: "ICON_SELECT",
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.TEXT },
                    },
                    {
                      propertyName: "iconAlign",
                      label: "Position",
                      helpText: "Sets the icon alignment of a menu item",
                      controlType: "ICON_TABS",
                      fullWidth: true,
                      options: [
                        {
                          icon: "VERTICAL_LEFT",
                          value: "left",
                        },
                        {
                          icon: "VERTICAL_RIGHT",
                          value: "right",
                        },
                      ],
                      isBindProperty: false,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.TEXT },
                    },
                  ],
                },
                {
                  sectionName: "Color",
                  children: [
                    {
                      propertyName: "iconColor",
                      helpText: "Sets the icon color of a menu item",
                      label: "Icon color",
                      controlType: "COLOR_PICKER",
                      isBindProperty: false,
                      isTriggerProperty: false,
                    },
                    {
                      propertyName: "textColor",
                      helpText: "Sets the text color of a menu item",
                      label: "Text color",
                      controlType: "COLOR_PICKER",
                      isBindProperty: false,
                      isTriggerProperty: false,
                    },
                    {
                      propertyName: "backgroundColor",
                      helpText: "Sets the background color of a menu item",
                      label: "Background color",
                      controlType: "COLOR_PICKER",
                      isBindProperty: false,
                      isTriggerProperty: false,
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
      {
        sectionName: "General",
        children: [
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
            propertyName: "animateLoading",
            label: "Animate Loading",
            controlType: "SWITCH",
            helpText: "Controls the loading of the widget",
            defaultValue: true,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isCompact",
            helpText: "Decides if menu items will consume lesser space",
            label: "Compact",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "menuVariant",
            label: "Button Variant",
            controlType: "ICON_TABS",
            fullWidth: true,
            helpText: "Sets the variant of the menu button",
            options: [
              {
                label: "Primary",
                value: ButtonVariantTypes.PRIMARY,
              },
              {
                label: "Secondary",
                value: ButtonVariantTypes.SECONDARY,
              },
              {
                label: "Tertiary",
                value: ButtonVariantTypes.TERTIARY,
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  ButtonVariantTypes.PRIMARY,
                  ButtonVariantTypes.SECONDARY,
                  ButtonVariantTypes.TERTIARY,
                ],
                default: ButtonVariantTypes.PRIMARY,
              },
            },
          },
        ],
      },
      {
        sectionName: "Icon",
        children: [
          {
            propertyName: "iconName",
            label: "Icon",
            helpText: "Sets the icon to be used for the menu button",
            controlType: "ICON_SELECT",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            updateHook: (
              props: MenuButtonWidgetProps,
              propertyPath: string,
              propertyValue: string,
            ) => {
              const propertiesToUpdate = [{ propertyPath, propertyValue }];
              if (!props.iconAlign) {
                propertiesToUpdate.push({
                  propertyPath: "iconAlign",
                  propertyValue: Alignment.LEFT,
                });
              }
              return propertiesToUpdate;
            },
            dependencies: ["iconAlign"],
            validation: {
              type: ValidationTypes.TEXT,
            },
          },
          {
            propertyName: "iconAlign",
            label: "Position",
            helpText: "Sets the icon alignment of the menu button",
            controlType: "ICON_TABS",
            fullWidth: true,
            options: [
              {
                icon: "VERTICAL_LEFT",
                value: "left",
              },
              {
                icon: "VERTICAL_RIGHT",
                value: "right",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["center", "left", "right"],
              },
            },
          },
          {
            propertyName: "placement",
            label: "Placement",
            controlType: "ICON_TABS",
            fullWidth: true,
            helpText: "Sets the space between items",
            options: [
              {
                label: "Start",
                value: ButtonPlacementTypes.START,
              },
              {
                label: "Between",
                value: ButtonPlacementTypes.BETWEEN,
              },
              {
                label: "Center",
                value: ButtonPlacementTypes.CENTER,
              },
            ],
            defaultValue: ButtonPlacementTypes.CENTER,
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: [
                  ButtonPlacementTypes.START,
                  ButtonPlacementTypes.BETWEEN,
                  ButtonPlacementTypes.CENTER,
                ],
                default: ButtonPlacementTypes.CENTER,
              },
            },
          },
        ],
      },
      {
        sectionName: "Color",
        children: [
          {
            propertyName: "menuColor",
            helpText: "Sets the style of the Menu button",
            label: "Button Color",
            controlType: "COLOR_PICKER",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.TEXT },
          },
        ],
      },
      {
        sectionName: "Border and Shadow",
        children: [
          {
            propertyName: "borderRadius",
            label: "Border Radius",
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
            label: "Box Shadow",
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

  menuItemClickHandler = (onClick: string | undefined) => {
    if (onClick) {
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
        },
      });
    }
  };

  getPageView() {
    const { componentWidth } = this.getComponentDimensions();
    const menuDropDownWidth = MinimumPopupRows * this.props.parentColumnSpace;

    return (
      <MenuButtonComponent
        {...this.props}
        menuDropDownWidth={menuDropDownWidth}
        onItemClicked={this.menuItemClickHandler}
        renderMode={this.props.renderMode}
        width={componentWidth}
      />
    );
  }

  static getWidgetType() {
    return "MENU_BUTTON_WIDGET";
  }
}

export default MenuButtonWidget;
