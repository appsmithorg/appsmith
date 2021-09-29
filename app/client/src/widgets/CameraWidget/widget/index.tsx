import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import CameraComponent from "../component";
import { CameraMode } from "../constants";

class CameraWidget extends BaseWidget<CameraWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "mode",
            label: "Mode",
            controlType: "DROP_DOWN",
            helpText: "Whether a picture is taken or a video is recorded",
            options: [
              {
                label: "Camera",
                value: "CAMERA",
              },
              {
                label: "Video",
                value: "VIDEO",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.TEXT,
              params: {
                allowedValues: ["CAMERA", "VIDEO"],
              },
            },
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
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
          {
            propertyName: "isMirrored",
            label: "Mirrored",
            helpText: "Show camera preview and get the screenshot mirrored",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: { type: ValidationTypes.BOOLEAN },
          },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the media is captured",
            propertyName: "onMediaCapture",
            label: "onMediaCapture",
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
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      image: undefined,
    };
  }

  static getWidgetType(): string {
    return "CAMERA_WIDGET";
  }

  getPageView() {
    const {
      bottomRow,
      isDisabled,
      isMirrored,
      leftColumn,
      mode,
      parentColumnSpace,
      parentRowSpace,
      rightColumn,
      topRow,
    } = this.props;

    const height = (bottomRow - topRow) * parentRowSpace - WIDGET_PADDING * 2;
    const width =
      (rightColumn - leftColumn) * parentColumnSpace - WIDGET_PADDING * 2;

    return (
      <CameraComponent
        disabled={isDisabled}
        height={height}
        mirrored={isMirrored}
        mode={mode}
        onImageCapture={this.handleImageCapture}
        onVideoCapture={this.handleVideoCapture}
        width={width}
      />
    );
  }

  handleImageCapture = (image?: string | null) => {
    this.props.updateWidgetMetaProperty("image", image, {
      triggerPropertyName: "onMediaCapture",
      dynamicString: this.props.onMediaCapture,
      event: {
        type: EventType.ON_CAMERA_MEDIA_CAPTURE,
      },
    });
  };

  handleVideoCapture = (video?: Blob | null) => {
    this.props.updateWidgetMetaProperty("video", video, {
      triggerPropertyName: "onMediaCapture",
      dynamicString: this.props.onMediaCapture,
      event: {
        type: EventType.ON_CAMERA_MEDIA_CAPTURE,
      },
    });
  };
}

export interface CameraWidgetProps extends WidgetProps {
  mode: CameraMode;
  isDisabled: boolean;
  isVisible: boolean;
  isMirrored: boolean;
  onMediaCapture?: string;
}

export default CameraWidget;
