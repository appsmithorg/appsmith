import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, RenderModes } from "constants/WidgetConstants";
import ImageComponent from "components/designSystems/appsmith/ImageComponent";
import {
  WidgetPropertyValidationType,
  BASE_WIDGET_VALIDATION,
} from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

class ImageWidget extends BaseWidget<ImageWidgetProps, WidgetState> {
  constructor(props: ImageWidgetProps) {
    super(props);
    this.onImageClick = this.onImageClick.bind(this);
  }
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            helpText: "Renders the url or Base64 in the widget",
            propertyName: "image",
            label: "Image",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL / Base64",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Renders the url or Base64 when no image is provided",
            propertyName: "defaultImage",
            label: "Default Image",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL / Base64",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Controls the visibility of the widget",
            propertyName: "isVisible",
            label: "Visible",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            helpText: "Controls the max zoom of the widget",
            propertyName: "maxZoomLevel",
            label: "Max Zoom Level",
            controlType: "DROP_DOWN",
            options: [
              {
                label: "1x (No Zoom)",
                value: 1,
              },
              {
                label: "2x",
                value: 2,
              },
              {
                label: "4x",
                value: 4,
              },
              {
                label: "8x",
                value: 8,
              },
              {
                label: "16x",
                value: 16,
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText:
              "Triggers an action when a user changes the selected option",
            propertyName: "onClick",
            label: "onClick",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }
  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      image: VALIDATION_TYPES.TEXT,
      imageShape: VALIDATION_TYPES.TEXT,
      defaultImage: VALIDATION_TYPES.TEXT,
      maxZoomLevel: VALIDATION_TYPES.NUMBER,
    };
  }
  getPageView() {
    const { maxZoomLevel } = this.props;
    return (
      <ImageComponent
        disableDrag={(disable: boolean) => {
          this.disableDrag(disable);
        }}
        maxZoomLevel={maxZoomLevel}
        widgetId={this.props.widgetId}
        imageUrl={this.props.image || ""}
        onClick={this.props.onClick ? this.onImageClick : undefined}
        showHoverPointer={this.props.renderMode === RenderModes.PAGE}
        defaultImageUrl={this.props.defaultImage}
        isLoading={this.props.isLoading}
      />
    );
  }

  onImageClick() {
    if (this.props.onClick) {
      super.executeAction({
        dynamicString: this.props.onClick,
        event: {
          type: EventType.ON_CLICK,
        },
      });
    }
  }

  getWidgetType(): WidgetType {
    return "IMAGE_WIDGET";
  }
}

export type ImageShape = "RECTANGLE" | "CIRCLE" | "ROUNDED";

export interface ImageWidgetProps extends WidgetProps {
  image: string;
  imageShape: ImageShape;
  defaultImage: string;
  maxZoomLevel: number;
  onClick?: string;
}

export default ImageWidget;
export const ProfiledImageWidget = Sentry.withProfiler(ImageWidget);
