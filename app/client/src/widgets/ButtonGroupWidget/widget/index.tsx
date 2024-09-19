import type { Alignment } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import type { ButtonPlacement, ButtonVariant } from "components/constants";
import { ButtonPlacementTypes, ButtonVariantTypes } from "components/constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { get } from "lodash";
import React from "react";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { MinimumPopupWidthInPercentage } from "WidgetProvider/constants";
import ButtonGroupComponent from "../component";
import { getStylesheetValue } from "./helpers";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import type {
  AnvilConfig,
  AutocompletionDefinitions,
} from "WidgetProvider/constants";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import { WIDGET_TAGS, layoutConfigurations } from "constants/WidgetConstants";
import { klonaFullWithTelemetry } from "utils/helpers";

class ButtonGroupWidget extends BaseWidget<
  ButtonGroupWidgetProps,
  WidgetState
> {
  static type = "BUTTON_GROUP_WIDGET";

  static getConfig() {
    return {
      name: "Button Group", // The display name which will be made in uppercase and show in the widgets panel ( can have spaces )
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      needsMeta: false, // Defines if this widget adds any meta properties
      isCanvas: false, // Defines if this widget has a canvas within in which we can drop other widgets
      searchTags: ["click", "submit"],
      tags: [WIDGET_TAGS.BUTTONS],
    };
  }

  static getDefaults() {
    return {
      rows: 4,
      columns: 24,
      widgetName: "ButtonGroup",
      orientation: "horizontal",
      buttonVariant: ButtonVariantTypes.PRIMARY,
      isVisible: true,
      version: 1,
      animateLoading: true,
      responsiveBehavior: ResponsiveBehavior.Fill,
      minWidth: FILL_WIDGET_MIN_WIDTH,
      groupButtons: {
        groupButton1: {
          label: "Favorite",
          iconName: "heart",
          id: "groupButton1",
          widgetId: "",
          buttonType: "SIMPLE",
          placement: "CENTER",
          isVisible: true,
          isDisabled: false,
          index: 0,
          menuItems: {},
        },
        groupButton2: {
          label: "Add",
          iconName: "add",
          id: "groupButton2",
          buttonType: "SIMPLE",
          placement: "CENTER",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 1,
          menuItems: {},
        },
        groupButton3: {
          label: "More",
          iconName: "more",
          id: "groupButton3",
          buttonType: "MENU",
          placement: "CENTER",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 2,
          menuItems: {
            menuItem1: {
              label: "First Option",
              backgroundColor: "#FFFFFF",
              id: "menuItem1",
              widgetId: "",
              onClick: "",
              isVisible: true,
              isDisabled: false,
              index: 0,
            },
            menuItem2: {
              label: "Second Option",
              backgroundColor: "#FFFFFF",
              id: "menuItem2",
              widgetId: "",
              onClick: "",
              isVisible: true,
              isDisabled: false,
              index: 1,
            },
            menuItem3: {
              label: "Delete",
              iconName: "trash",
              iconColor: "#FFFFFF",
              iconAlign: "right",
              textColor: "#FFFFFF",
              backgroundColor: "#DD4B34",
              id: "menuItem3",
              widgetId: "",
              onClick: "",
              isVisible: true,
              isDisabled: false,
              index: 2,
            },
          },
        },
      },
      blueprint: {
        operations: [
          {
            type: BlueprintOperationTypes.MODIFY_PROPS,
            fn: (widget: WidgetProps & { children?: WidgetProps[] }) => {
              const groupButtons = klonaFullWithTelemetry(
                widget.groupButtons,
                "ButtonGroupWidget.groupButtons",
              );

              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const dynamicBindingPathList: any[] = get(
                widget,
                "dynamicBindingPathList",
                [],
              );

              Object.keys(groupButtons).map((groupButtonKey) => {
                groupButtons[groupButtonKey].buttonColor = get(
                  widget,
                  "childStylesheet.button.buttonColor",
                  "{{appsmith.theme.colors.primaryColor}}",
                );

                dynamicBindingPathList.push({
                  key: `groupButtons.${groupButtonKey}.buttonColor`,
                });
              });

              const updatePropertyMap = [
                {
                  widgetId: widget.widgetId,
                  propertyName: "dynamicBindingPathList",
                  propertyValue: dynamicBindingPathList,
                },
                {
                  widgetId: widget.widgetId,
                  propertyName: "groupButtons",
                  propertyValue: groupButtons,
                },
              ];

              return updatePropertyMap;
            },
          },
        ],
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      autoDimension: {
        height: true,
      },
      widgetSize: [
        {
          viewportMinWidth: 0,
          configuration: (props: ButtonGroupWidgetProps) => {
            let minWidth = 120;
            const buttonLength = Object.keys(props.groupButtons).length;

            if (props.orientation === "horizontal") {
              // 120 is the width of the button, 8 is widget padding, 1 is the gap between buttons
              minWidth = 120 * buttonLength + 8 + (buttonLength - 1) * 1;
            }

            return {
              minWidth: `${minWidth}px`,
              minHeight: "40px",
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
      widgetSize: (props: ButtonGroupWidgetProps) => {
        let minWidth = 120;
        const buttonLength = Object.keys(props.groupButtons).length;

        if (props.orientation === "horizontal") {
          // 120 is the width of the button, 8 is widget padding, 1 is the gap between buttons
          minWidth = 120 * buttonLength + 8 + (buttonLength - 1) * 1;
        }

        return {
          maxHeight: {},
          maxWidth: {},
          minHeight: { base: "40px" },
          minWidth: { base: `${minWidth}px` },
        };
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      "!doc":
        "The Button group widget represents a set of buttons in a group. Group can have simple buttons or menu buttons with drop-down items.",
      "!url": "https://docs.appsmith.com/widget-reference/button-group",
      isVisible: DefaultAutocompleteDefinitions.isVisible,
    };
  }

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
                // TODO: Fix this the next time the file is edited
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                      label: "Button type",
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
                      defaultValue: "SIMPLE",
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
                      helpText: "Menu items",
                      propertyName: "menuItems",
                      controlType: "MENU_ITEMS",
                      label: "Menu items",
                      isBindProperty: false,
                      isTriggerProperty: false,
                      panelConfig: {
                        editableTitle: true,
                        titlePropertyName: "label",
                        panelIdPropertyName: "id",
                        updateHook: (
                          // TODO: Fix this the next time the file is edited
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                                helpText: "when the menu item is clicked",
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
                                fullWidth: false,
                                options: [
                                  {
                                    startIcon: "skip-left-line",
                                    value: "left",
                                  },
                                  {
                                    startIcon: "skip-right-line",
                                    value: "right",
                                  },
                                ],
                                defaultValue: "left",
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
                                label: "Background color",
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
                                label: "Text color",
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
                      helpText: "when the button is clicked",
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
                      isJSConvertible: true,
                      isBindProperty: true,
                      isTriggerProperty: false,
                      validation: { type: ValidationTypes.TEXT },
                    },
                    {
                      propertyName: "iconAlign",
                      label: "Position",
                      helpText: "Sets the icon alignment of a button",
                      controlType: "ICON_TABS",
                      fullWidth: false,
                      options: [
                        {
                          startIcon: "skip-left-line",
                          value: "left",
                        },
                        {
                          startIcon: "skip-right-line",
                          value: "right",
                        },
                      ],
                      defaultValue: "left",
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
                      label: "Button color",
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
    ];
  }

  static getPropertyPaneStyleConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "buttonVariant",
            label: "Button variant",
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
            defaultValue: ButtonVariantTypes.PRIMARY,
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
            defaultValue: "horizontal",
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
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
      childStylesheet: {
        button: {
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
      },
    };
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
      },
    };
  }

  getWidgetView() {
    const { componentWidth } = this.props;
    const minPopoverWidth =
      (MinimumPopupWidthInPercentage / 100) *
      (this.props.mainCanvasWidth ?? layoutConfigurations.MOBILE.maxWidth);

    return (
      <ButtonGroupComponent
        borderRadius={this.props.borderRadius}
        boxShadow={this.props.boxShadow}
        buttonClickHandler={this.handleClick}
        buttonMinWidth={this.isAutoLayoutMode ? 120 : undefined}
        buttonVariant={this.props.buttonVariant}
        groupButtons={this.props.groupButtons}
        isDisabled={this.props.isDisabled}
        minHeight={this.isAutoLayoutMode ? this.props.minHeight : undefined}
        minPopoverWidth={minPopoverWidth}
        orientation={this.props.orientation}
        renderMode={this.props.renderMode}
        widgetId={this.props.widgetId}
        width={componentWidth}
      />
    );
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
