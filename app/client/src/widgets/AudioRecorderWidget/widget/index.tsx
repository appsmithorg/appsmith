import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import AudioRecorderComponent from "../component";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { createBlobUrl } from "utils/AppsmithUtils";
import { FileDataTypes } from "widgets/constants";

export interface AudioRecorderWidgetProps extends WidgetProps {
  backgroundColor: string;
  iconColor: string;
  isDisabled: boolean;
  isValid: boolean;
  onRecordingStart?: string;
  onRecordingComplete?: string;
  blobUrl?: string;
}

class AudioRecorderWidget extends BaseWidget<
  AudioRecorderWidgetProps,
  WidgetState
> {
  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "backgroundColor",
            helpText: "Sets the background color of the widget",
            label: "Background color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "iconColor",
            helpText: "Sets the icon color of the widget",
            label: "Icon color",
            controlType: "COLOR_PICKER",
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables input to this widget",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
            validation: {
              type: ValidationTypes.BOOLEAN,
            },
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
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
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the recording starts",
            propertyName: "onRecordingStart",
            label: "onRecordingStart",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
          {
            helpText: "Triggers an action when the recording ends",
            propertyName: "onRecordingComplete",
            label: "onRecordingComplete",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      blobUrl: undefined,
      dataAsDataURL: undefined,
      dataAsRawBinary: undefined,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    // return {
    //   url: `{{URL.createObjectURL(this.recordedFile)}}`,
    // };
    return {};
  }

  handleRecordingStart = () => {
    if (this.props.blobUrl) {
      URL.revokeObjectURL(this.props.blobUrl);
    }

    this.props.updateWidgetMetaProperty("dataAsDataURL", undefined);
    this.props.updateWidgetMetaProperty("dataAsRawBinary", undefined);

    if (this.props.onRecordingStart) {
      super.executeAction({
        triggerPropertyName: "onRecordingStart",
        dynamicString: this.props.onRecordingStart,
        event: {
          type: EventType.ON_RECORDING_START,
        },
      });
    }
  };

  handleRecordingComplete = (blobUrl?: string, blob?: Blob) => {
    if (!blobUrl) {
      this.props.updateWidgetMetaProperty("blobUrl", undefined);
      this.props.updateWidgetMetaProperty("dataAsDataURL", undefined);
      this.props.updateWidgetMetaProperty("dataAsRawBinary", undefined);
      return;
    }
    this.props.updateWidgetMetaProperty("blobUrl", blobUrl);
    if (blob) {
      const blobIdForBase64 = createBlobUrl(blob, FileDataTypes.Base64);
      const blobIdForRaw = createBlobUrl(blob, FileDataTypes.Binary);

      this.props.updateWidgetMetaProperty("dataAsDataURL", blobIdForBase64, {
        triggerPropertyName: "onRecordingComplete",
        dynamicString: this.props.onRecordingComplete,
        event: {
          type: EventType.ON_RECORDING_COMPLETE,
        },
      });
      this.props.updateWidgetMetaProperty("dataAsRawBinary", blobIdForRaw, {
        triggerPropertyName: "onRecordingComplete",
        dynamicString: this.props.onRecordingComplete,
        event: {
          type: EventType.ON_RECORDING_COMPLETE,
        },
      });
    }
  };

  getPageView() {
    const {
      backgroundColor,
      blobUrl,
      bottomRow,
      iconColor,
      isDisabled,
      leftColumn,
      parentColumnSpace,
      parentRowSpace,
      rightColumn,
      topRow,
    } = this.props;

    return (
      <AudioRecorderComponent
        backgroundColor={backgroundColor}
        blobUrl={blobUrl}
        height={(bottomRow - topRow) * parentRowSpace}
        iconColor={iconColor}
        isDisabled={isDisabled}
        onRecordingComplete={this.handleRecordingComplete}
        onRecordingStart={this.handleRecordingStart}
        width={(rightColumn - leftColumn) * parentColumnSpace}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "AUDIO_RECORDER_WIDGET";
  }
}

export default AudioRecorderWidget;
