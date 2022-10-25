import React from "react";
import { get } from "lodash";
import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { ValidationTypes } from "constants/WidgetValidation";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import {
  ButtonVariant,
  ButtonPlacementTypes,
  ButtonPlacement,
  ButtonVariantTypes,
} from "components/constants";
import ButtonGroupComponent from "../component";
import { MinimumPopupRows } from "widgets/constants";
import { getStylesheetValue } from "./helpers";

class ButtonGroupWidget extends BaseWidget<
  ButtonGroupWidgetProps,
  WidgetState
> {
  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "Data",
        children: [
          {
            helpText: "Group Buttons",
            propertyName: "groupButtons",
            controlType: "GROUP_BUTTONS",
            label: "Buttons",
            isBindProperty: false,
            isTriggerProperty: false,
            dependencies: ["childStylesheet"],
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
                  sectionName: "Data",
                  children: [
                    {
                      propertyName: "buttonType",
                      label: "Button Type",
                      controlType: "ICON_TABS",
                      fullWidth: true,
                      helpText: "Sets button type",
                      options: [
                        {
                          label: "Simple",
                          value: "SIMPLE",
                        },
                        {
                          label: "Menu",
                          value: "MENU",
                        },
                      ],
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: {
                        type: ValidationTypes.TEXT,
                        params: {
                          allowedValues: ["SIMPLE", "MENU"],
                        },
                      },
                    },
                    {
                      hidden: (
                        props: ButtonGroupWidgetProps,
                        propertyPath: string,
                      ) => {
                        const buttonType = get(
                          props,
                          `${propertyPath.split(".", 2).join(".")}.buttonType`,
                          "",
                        );
                        return buttonType !== "MENU";
                      },
                      dependencies: ["groupButtons"],
                      helpText: "Menu Items",
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
                            sectionName: "Label",
                            children: [
                              {
                                propertyName: "label",
                                helpText: "Sets the label of a menu item",
                                label: "Text",
                                controlType: "INPUT_TEXT",
                                placeholderText: "Enter label",
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
                                propertyName: "isVisible",
                                helpText:
                                  "Controls the visibility of menu item",
                                label: "Visible",
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
                                helpText: "Disables menu item",
                                label: "Disabled",
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
                            sectionName: "Events",
                            children: [
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
                        ],
                        styleChildren: [
                          {
                            sectionName: "Icon",
                            children: [
                              {
                                propertyName: "iconName",
                                label: "Icon",
                                helpText:
                                  "Sets the icon to be used for a menu item",
                                controlType: "ICON_SELECT",
                                isJSConvertible: true,
                                isBindProperty: true,
                                isTriggerProperty: false,
                                validation: { type: ValidationTypes.TEXT },
                              },
                              {
                                propertyName: "iconAlign",
                                label: "Position",
                                helpText:
                                  "Sets the icon alignment of a menu item",
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
                                propertyName: "backgroundColor",
                                helpText:
                                  "Sets the background color of a menu item",
                                label: "Background Color",
                                controlType: "COLOR_PICKER",
                                isJSConvertible: true,
                                isBindProperty: true,
                                isTriggerProperty: false,
                                validation: { type: ValidationTypes.TEXT },
                              },
                              {
                                propertyName: "iconColor",
                                helpText: "Sets the icon color of a menu item",
                                label: "Icon Color",
                                controlType: "COLOR_PICKER",
                                isBindProperty: false,
                                isTriggerProperty: false,
                              },
                              {
                                propertyName: "textColor",
                                helpText: "Sets the text color of a menu item",
                                label: "Text Color",
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
                  sectionName: "Label",
                  children: [
                    {
                      propertyName: "label",
                      helpText: "Sets the label of a menu item",
                      label: "Text",
                      controlType: "INPUT_TEXT",
                      placeholderText: "Enter label",
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
                {
                  sectionName: "Events",
                  hidden: (
                    props: ButtonGroupWidgetProps,
                    propertyPath: string,
                  ) => {
                    const buttonType = get(
                      props,
                      `${propertyPath}.buttonType`,
                      "",
                    );
                    return buttonType === "MENU";
                  },
                  children: [
                    {
                      helpText: "Triggers an action when the button is clicked",
                      propertyName: "onClick",
                      label: "onClick",
                      controlType: "ACTION_SELECTOR",
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: true,
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
                      helpText: "Sets the icon to be used for a button",
                      controlType: "ICON_SELECT",
                      isBindProperty: false,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.TEXT },
                    },
                    {
                      propertyName: "iconAlign",
                      label: "Position",
                      helpText: "Sets the icon alignment of a button",
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
                    {
                      propertyName: "placement",
                      label: "Placement",
                      controlType: "DROP_DOWN",
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
                      getStylesheetValue,
                      propertyName: "buttonColor",
                      helpText: "Changes the color of the button",
                      label: "Button Color",
                      controlType: "COLOR_PICKER",
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.TEXT },
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
            controlType: "SWITCH",
            helpText: "Disables clicks to this widget",
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
            propertyName: "buttonVariant",
            label: "Button Variant",
            controlType: "ICON_TABS",
            fullWidth: true,
            helpText: "Sets the variant of the button",
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
          {
            helpText: "Controls widget orientation",
            propertyName: "orientation",
            label: "Orientation",
            controlType: "ICON_TABS",
            fullWidth: true,
            options: [
              {
                label: "Horizontal",
                value: "horizontal",
              },
              {
                label: "Vertical",
                value: "vertical",
              },
            ],
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

  handleClick = (onClick: string | undefined, callback: () => void): void => {
    if (onClick) {
      super.executeAction({
        triggerPropertyName: "onClick",
        dynamicString: onClick,
        event: {
          type: EventType.ON_CLICK,
          callback,
        },
      });
    }
  };

  getPageView() {
    const { componentWidth } = this.getComponentDimensions();
    const minPopoverWidth = MinimumPopupRows * this.props.parentColumnSpace;

    return (
      <ButtonGroupComponent
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        buttonClickHandler={this.handleClick}
        buttonVariant={this.props.buttonVariant}
        groupButtons={this.props.groupButtons}
        isDisabled={this.props.isDisabled}
        minPopoverWidth={minPopoverWidth}
        orientation={this.props.orientation}
        renderMode={this.props.renderMode}
        widgetId={this.props.widgetId}
        width={componentWidth}
      />
    );
  }

  static getWidgetType(): string {
    return "BUTTON_GROUP_WIDGET";
  }
}

export interface ButtonGroupWidgetProps extends WidgetProps {
  orientation: string;
  isDisabled: boolean;
  borderRadius?: string;
  boxShadow?: string;
  buttonVariant: ButtonVariant;
  groupButtons: Record<
    string,
    {
      widgetId: string;
      id: string;
      index: number;
      isVisible?: boolean;
      isDisabled?: boolean;
      label?: string;
      buttonType?: string;
      buttonColor?: string;
      iconName?: IconName;
      iconAlign?: Alignment;
      placement?: ButtonPlacement;
      onClick?: string;
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
    }
  >;
}

export default ButtonGroupWidget;
