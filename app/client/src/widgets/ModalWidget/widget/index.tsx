import React from "react";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { RenderMode } from "constants/WidgetConstants";
import { GridDefaults } from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import type { SetterConfig, Stylesheet } from "entities/AppTheming";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import {
  FlexLayerAlignment,
  type Alignment,
  type Spacing,
  ResponsiveBehavior,
  Positioning,
} from "layoutSystems/common/utils/constants";
import { generateClassName } from "utils/generators";
import WidgetFactory from "WidgetProvider/factory";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import BaseWidget from "widgets/BaseWidget";
import { DefaultAutocompleteDefinitions } from "widgets/WidgetUtils";
import ModalComponent from "../component";
import { get } from "lodash";
import { IconNames } from "@blueprintjs/icons";
import { Colors } from "constants/Colors";
import {
  ButtonBorderRadiusTypes,
  ButtonVariantTypes,
} from "components/constants";
import { WIDGET_TAGS } from "constants/WidgetConstants";
import type {
  AutocompletionDefinitions,
  FlattenedWidgetProps,
} from "WidgetProvider/constants";
import { BlueprintOperationTypes } from "WidgetProvider/constants";
import IconSVG from "../icon.svg";
import ThumbnailSVG from "../thumbnail.svg";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { getWidgetBluePrintUpdates } from "utils/WidgetBlueprintUtils";
import { DynamicHeight } from "utils/WidgetFeatures";
import type { FlexLayer } from "layoutSystems/autolayout/utils/types";
import type { LayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import { modalPreset } from "layoutSystems/autolayout/layoutComponents/presets/ModalPreset";
import { LayoutSystemTypes } from "layoutSystems/types";

export class ModalWidget extends BaseWidget<ModalWidgetProps, WidgetState> {
  static type = "MODAL_WIDGET";

  static getConfig() {
    return {
      name: "Modal",
      iconSVG: IconSVG,
      thumbnailSVG: ThumbnailSVG,
      tags: [WIDGET_TAGS.LAYOUT],
      needsMeta: true,
      isCanvas: true,
      searchTags: ["dialog", "popup", "notification"],
    };
  }

  static getFeatures() {
    return {
      dynamicHeight: {
        sectionIndex: 0,
        active: true,
      },
    };
  }
  static getDefaults() {
    return {
      rows: 24,
      columns: 24,
      width: 456,
      height: GridDefaults.DEFAULT_GRID_ROW_HEIGHT * 24,
      minDynamicHeight: 24,
      canEscapeKeyClose: true,
      animateLoading: true,
      // detachFromLayout is set true for widgets that are not bound to the widgets within the layout.
      // setting it to true will only render the widgets(from sidebar) on the main container without any collision check.
      detachFromLayout: true,
      canOutsideClickClose: true,
      shouldScrollContents: true,
      widgetName: "Modal",
      children: [],
      version: 2,
      blueprint: {
        view: [
          {
            type: "CANVAS_WIDGET",
            position: { left: 0, top: 0 },
            props: {
              detachFromLayout: true,
              canExtend: true,
              isVisible: true,
              isDisabled: false,
              shouldScrollContents: false,
              children: [],
              version: 1,
              blueprint: {
                view: [
                  {
                    type: "ICON_BUTTON_WIDGET",
                    position: { left: 58, top: 0 },
                    size: {
                      rows: 4,
                      cols: 6,
                    },
                    props: {
                      buttonColor: Colors.GREY_7,
                      buttonVariant: ButtonVariantTypes.TERTIARY,
                      borderRadius: ButtonBorderRadiusTypes.SHARP,
                      iconName: IconNames.CROSS,
                      iconSize: 24,
                      version: 1,
                    },
                  },
                  {
                    type: "TEXT_WIDGET",
                    position: { left: 1, top: 1 },
                    size: {
                      rows: 4,
                      cols: 40,
                    },
                    props: {
                      text: "Modal Title",
                      fontSize: "1.25rem",
                      version: 1,
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    position: {
                      left: 31,
                      top: 18,
                    },
                    size: {
                      rows: 4,
                      cols: 16,
                    },
                    props: {
                      text: "Close",
                      buttonStyle: "PRIMARY",
                      buttonVariant: ButtonVariantTypes.SECONDARY,
                      version: 1,
                    },
                  },
                  {
                    type: "BUTTON_WIDGET",
                    position: {
                      left: 47,
                      top: 18,
                    },
                    size: {
                      rows: 4,
                      cols: 16,
                    },
                    props: {
                      text: "Confirm",
                      buttonStyle: "PRIMARY_BUTTON",
                      version: 1,
                    },
                  },
                ],
                operations: [
                  {
                    type: BlueprintOperationTypes.MODIFY_PROPS,
                    fn: (
                      widget: WidgetProps & { children?: WidgetProps[] },
                      widgets: { [widgetId: string]: FlattenedWidgetProps },
                      parent?: WidgetProps & { children?: WidgetProps[] },
                    ) => {
                      const iconChild =
                        widget.children &&
                        widget.children.find(
                          (child) => child.type === "ICON_BUTTON_WIDGET",
                        );

                      if (iconChild && parent) {
                        return [
                          {
                            widgetId: iconChild.widgetId,
                            propertyName: "onClick",
                            propertyValue: `{{closeModal(${parent.widgetName}.name);}}`,
                          },
                          {
                            widgetId: iconChild.widgetId,
                            propertyName: "dynamicTriggerPathList",
                            propertyValue: [{ key: "onClick" }],
                          },
                        ];
                      }
                    },
                  },
                  {
                    type: BlueprintOperationTypes.MODIFY_PROPS,
                    fn: (
                      widget: WidgetProps & { children?: WidgetProps[] },
                      widgets: { [widgetId: string]: FlattenedWidgetProps },
                      parent?: WidgetProps & { children?: WidgetProps[] },
                    ) => {
                      const cancelBtnChild =
                        widget.children &&
                        widget.children.find(
                          (child) =>
                            child.type === "BUTTON_WIDGET" &&
                            child.text === "Close",
                        );

                      if (cancelBtnChild && parent) {
                        return [
                          {
                            widgetId: cancelBtnChild.widgetId,
                            propertyName: "onClick",
                            propertyValue: `{{closeModal(${parent.widgetName}.name);}}`,
                          },
                          {
                            widgetId: cancelBtnChild.widgetId,
                            propertyName: "dynamicTriggerPathList",
                            propertyValue: [{ key: "onClick" }],
                          },
                        ];
                      }
                    },
                  },
                ],
              },
            },
          },
        ],
        operations: [
          {
            type: BlueprintOperationTypes.MODIFY_PROPS,
            fn: (
              widget: FlattenedWidgetProps,
              widgets: CanvasWidgetsReduxState,
              parent?: WidgetProps & { children?: WidgetProps[] },
              layoutSystemType?: LayoutSystemTypes,
            ) => {
              if (layoutSystemType === LayoutSystemTypes.FIXED) {
                return [];
              }

              //get Canvas Widget
              const canvasWidget: FlattenedWidgetProps = get(
                widget,
                "children.0",
              );

              //get Children Ids of the StatBox
              const childrenIds: string[] = get(widget, "children.0.children");

              //get Children props of the StatBox
              const children: FlattenedWidgetProps[] = childrenIds.map(
                (childId) => widgets[childId],
              );

              //get the Text Widgets
              const textWidget = children.filter(
                (child) => child.type === "TEXT_WIDGET",
              )?.[0];

              //get all the Icon button Widgets
              const iconWidget = children.filter(
                (child) => child.type === "ICON_BUTTON_WIDGET",
              )?.[0];

              const [buttonWidget1, buttonWidget2] = children.filter(
                (child) => child.type === "BUTTON_WIDGET",
              );

              //Create flex layer object based on the children
              const flexLayers: FlexLayer[] = [
                {
                  children: [
                    {
                      id: textWidget.widgetId,
                      align: FlexLayerAlignment.Start,
                    },
                    {
                      id: iconWidget.widgetId,
                      align: FlexLayerAlignment.End,
                    },
                  ],
                },
                {
                  children: [
                    {
                      id: buttonWidget1.widgetId,
                      align: FlexLayerAlignment.End,
                    },
                    {
                      id: buttonWidget2.widgetId,
                      align: FlexLayerAlignment.End,
                    },
                  ],
                },
              ];

              const layout: LayoutProps[] = modalPreset(
                textWidget.widgetId,
                iconWidget.widgetId,
                buttonWidget2.widgetId,
                buttonWidget1.widgetId,
              );

              //Add widget specific property Defaults, for autoLayout widget
              const { disabledPropsDefaults } =
                WidgetFactory.getWidgetAutoLayoutConfig("MODAL_WIDGET") || {};

              //create properties to be updated
              return getWidgetBluePrintUpdates({
                [widget.widgetId]: {
                  dynamicHeight: DynamicHeight.AUTO_HEIGHT,
                  height: 100,
                  ...disabledPropsDefaults,
                },
                [canvasWidget.widgetId]: {
                  flexLayers,
                  useAutoLayout: true,
                  positioning: Positioning.Vertical,
                  bottomRow: 100,
                  layout,
                },
                [textWidget.widgetId]: {
                  responsiveBehavior: ResponsiveBehavior.Fill,
                  alignment: FlexLayerAlignment.Start,
                  topRow: 0,
                  bottomRow: 4,
                  leftColumn: 0,
                  rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 4,
                },
                [iconWidget.widgetId]: {
                  responsiveBehavior: ResponsiveBehavior.Hug,
                  alignment: FlexLayerAlignment.End,
                  topRow: 0,
                  bottomRow: 4,
                  leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 4,
                  rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
                },
                [buttonWidget1.widgetId]: {
                  responsiveBehavior: ResponsiveBehavior.Hug,
                  alignment: FlexLayerAlignment.End,
                  topRow: 4,
                  bottomRow: 8,
                  leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 2 * 16,
                  rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
                },
                [buttonWidget2.widgetId]: {
                  responsiveBehavior: ResponsiveBehavior.Hug,
                  alignment: FlexLayerAlignment.End,
                  topRow: 4,
                  bottomRow: 8,
                  leftColumn: GridDefaults.DEFAULT_GRID_COLUMNS - 16,
                  rightColumn: GridDefaults.DEFAULT_GRID_COLUMNS,
                },
              });
            },
          },
        ],
      },
    };
  }

  static getAutoLayoutConfig() {
    return {
      disabledPropsDefaults: {
        minDynamicHeight: 8,
      },
    };
  }

  static getAutocompleteDefinitions(): AutocompletionDefinitions {
    return {
      isVisible: DefaultAutocompleteDefinitions.isVisible,
      name: {
        "!type": "string",
        "!doc": "Returns the modal name",
      },
    };
  }

  static getDerivedPropertiesMap() {
    return {
      name: "{{this.widgetName}}",
    };
  }

  static getSetterConfig(): SetterConfig {
    return {
      __setters: {},
    };
  }

  static getPropertyPaneContentConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Enables scrolling for content inside the widget",
            propertyName: "shouldScrollContents",
            label: "Scroll contents",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
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
            propertyName: "canOutsideClickClose",
            label: "Quick Dismiss",
            helpText: "Allows dismissing the modal when user taps outside",
            controlType: "SWITCH",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          // { ...generatePositioningConfig(Positioning.Fixed) },
        ],
      },
      {
        sectionName: "Events",
        children: [
          {
            helpText: "when the modal is closed",
            propertyName: "onClose",
            label: "onClose",
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
        sectionName: "Color",
        children: [
          {
            propertyName: "backgroundColor",
            helpText: "Sets the background color of the widget",
            label: "Background color",
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

  static getStylesheetConfig(): Stylesheet {
    return {
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      boxShadow: "none",
    };
  }

  static defaultProps = {
    isOpen: true,
    canEscapeKeyClose: false,
  };

  getModalVisibility() {
    if (this.props.selectedWidgetAncestry) {
      return (
        this.props.selectedWidgetAncestry.includes(this.props.widgetId) ||
        !!this.props.isVisible
      );
    }

    return !!this.props.isVisible;
  }

  onModalClose = () => {
    if (this.props.onClose) {
      super.executeAction({
        triggerPropertyName: "onClose",
        dynamicString: this.props.onClose,
        event: {
          type: EventType.ON_MODAL_CLOSE,
        },
      });
    }
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  closeModal = (e: any) => {
    this.props.updateWidgetMetaProperty("isVisible", false);
    this.selectWidgetRequest(SelectionRequestType.Empty);
    // TODO(abhinav): Create a static property with is a map of widget properties
    // Populate the map on widget load
    e.stopPropagation();
    e.preventDefault();
  };

  makeModalComponent() {
    return (
      <ModalComponent
        alignment={this.props.alignment}
        background={this.props.backgroundColor}
        borderRadius={this.props.borderRadius}
        canEscapeKeyClose={!!this.props.canEscapeKeyClose}
        className={`t--modal-widget ${generateClassName(this.props.widgetId)}`}
        height={this.props.height}
        isOpen={this.getModalVisibility()}
        modalChildrenProps={this.props.children || []}
        onClose={this.closeModal}
        onModalClose={this.onModalClose}
        positioning={this.props.positioning}
        renderMode={this.props.renderMode}
        scrollContents={!!this.props.shouldScrollContents}
        shouldScrollContents={!!this.props.shouldScrollContents}
        spacing={this.props.spacing}
        widgetId={this.props.widgetId}
        width={this.props.width}
      />
    );
  }

  getWidgetView() {
    return this.makeModalComponent();
  }
}
export interface ModalWidgetProps extends WidgetProps {
  renderMode: RenderMode;
  isOpen?: boolean;
  children?: WidgetProps[];
  canOutsideClickClose?: boolean;
  width: number;
  height: number;
  deselectAllWidgets: () => void;
  canEscapeKeyClose?: boolean;
  shouldScrollContents?: boolean;
  size: string;
  onClose: string;
  mainContainer: WidgetProps;
  backgroundColor: string;
  borderRadius: string;
  mainCanvasWidth: number;
  positioning?: Positioning;
  alignment: Alignment;
  spacing: Spacing;
}

export default ModalWidget;
