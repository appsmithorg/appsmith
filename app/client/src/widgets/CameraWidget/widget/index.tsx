import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { ValidationTypes } from "constants/WidgetValidation";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import CameraComponent from "../component";
import { CameraMode, CameraModeTypes } from "../constants";

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
            helpText: "Triggers an action when the image is captured",
            propertyName: "onImageCapture",
            label: "OnImageCapture",
            controlType: "ACTION_SELECTOR",
            hidden: (props: CameraWidgetProps) =>
              props.mode === CameraModeTypes.VIDEO,
            dependencies: ["mode"],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the video recording get started",
            propertyName: "onRecordingStart",
            label: "OnRecordingStart",
            controlType: "ACTION_SELECTOR",
            hidden: (props: CameraWidgetProps) =>
              props.mode === CameraModeTypes.CAMERA,
            dependencies: ["mode"],
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the video recording stops",
            propertyName: "onRecordingStop",
            label: "onRecordingStop",
            controlType: "ACTION_SELECTOR",
            hidden: (props: CameraWidgetProps) =>
              props.mode === CameraModeTypes.CAMERA,
            dependencies: ["mode"],
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
      videoURL: `{{ URL.createObjectURL(this.video) }}`,
    };
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      image: undefined,
      video: undefined,
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
        onRecordingStart={this.handleRecordingStart}
        onRecordingStop={this.handleRecordingStop}
        width={width}
      />
    );
  }

  handleImageCapture = (image?: string | null) => {
    if (!image) {
      this.props.updateWidgetMetaProperty("image", image);
      return;
    }
    this.props.updateWidgetMetaProperty("image", image, {
      triggerPropertyName: "onImageCapture",
      dynamicString: this.props.onImageCapture,
      event: {
        type: EventType.ON_CAMERA_IMAGE_CAPTURE,
      },
    });
  };

  handleRecordingStart = () => {
    if (this.props.onRecordingStart) {
      super.executeAction({
        triggerPropertyName: "onRecordingStart",
        dynamicString: this.props.onRecordingStart,
        event: {
          type: EventType.ON_CAMERA_VIDEO_RECORDING_START,
        },
      });
    }
  };

  handleRecordingStop = (video?: Blob | null) => {
    if (!video) {
      this.props.updateWidgetMetaProperty("video", video);
      return;
    }
    this.props.updateWidgetMetaProperty("video", video, {
      triggerPropertyName: "onRecordingStop",
      dynamicString: this.props.onRecordingStop,
      event: {
        type: EventType.ON_CAMERA_VIDEO_RECORDING_STOP,
      },
    });
  };
}

export interface CameraWidgetProps extends WidgetProps {
  mode: CameraMode;
  isDisabled: boolean;
  isVisible: boolean;
  isMirrored: boolean;
  onImageCapture?: string;
  onRecordingStart?: string;
  onRecordingStop?: string;
}

export default CameraWidget;
