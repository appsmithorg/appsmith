import * as React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType, RenderModes } from "constants/WidgetConstants";
import ImageComponent from "components/designSystems/appsmith/ImageComponent";
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
            validation: VALIDATION_TYPES.IMAGE,
          },
          {
            helpText: "Renders the url or Base64 when no image is provided",
            propertyName: "defaultImage",
            label: "Default Image",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter URL / Base64",
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
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
            validation: VALIDATION_TYPES.NUMBER,
          },
          {
            helpText:
              "Sets how the Image should be resized to fit its container.",
            propertyName: "objectFit",
            label: "Object Fit",
            controlType: "DROP_DOWN",
            defaultValue: "cover",
            options: [
              {
                label: "Contain",
                value: "contain",
              },
              {
                label: "Cover",
                value: "cover",
              },
              {
                label: "Auto",
                value: "auto",
              },
            ],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: VALIDATION_TYPES.TEXT,
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

  getPageView() {
    const { maxZoomLevel, objectFit } = this.props;
    return (
      <ImageComponent
        defaultImageUrl={this.props.defaultImage}
        disableDrag={(disable: boolean) => {
          this.disableDrag(disable);
        }}
        imageUrl={this.props.image}
        isLoading={this.props.isLoading}
        maxZoomLevel={maxZoomLevel}
        objectFit={objectFit}
        onClick={this.props.onClick ? this.onImageClick : undefined}
        showHoverPointer={this.props.renderMode === RenderModes.PAGE}
        widgetId={this.props.widgetId}
      />
    );
  }

  onImageClick() {
    if (this.props.onClick) {
      super.executeAction({
        triggerPropertyName: "onClick",
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
  objectFit: string;
  onClick?: string;
}

export default ImageWidget;
export const ProfiledImageWidget = Sentry.withProfiler(ImageWidget);
