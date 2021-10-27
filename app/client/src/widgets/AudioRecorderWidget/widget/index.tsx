import React from "react";

import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import AudioRecorderComponent from "../component";
import { DerivedPropertiesMap } from "utils/WidgetFactory";
import { BlobContent, BlobContentTypes } from "../constants";

// Get blot contents
export const getBlobContent = (
  blob: Blob,
  readType: BlobContent,
): Promise<Record<string, string | ArrayBuffer | null>> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      switch (readType) {
        case BlobContentTypes.RAW_BINARY:
          resolve({ raw: reader.result });
          break;
        case BlobContentTypes.DATA_URL:
          resolve({ base64: reader.result });
          break;
        default:
          resolve({ text: reader.result });
          break;
      }
    };

    reader.onerror = reject;

    // read blob content
    switch (readType) {
      case BlobContentTypes.RAW_BINARY:
        reader.readAsBinaryString(blob);
        break;
      case BlobContentTypes.DATA_URL:
        reader.readAsDataURL(blob);
        break;
      default:
        reader.readAsText(blob);
        break;
    }
  });

export interface AudioRecorderWidgetProps extends WidgetProps {
  backgroundColor: string;
  iconColor: string;
  isDisabled: boolean;
  isValid: boolean;
  onRecordingStart?: string;
  onRecordingComplete?: string;
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
      recordedFile: null,
    };
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {
      url: `{{URL.createObjectURL(this.recordedFile)}}`,
    };
  }

  handleRecordingStart = () => {
    this.props.updateWidgetMetaProperty("recordedFile", null);

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
      this.props.updateWidgetMetaProperty("recordedFile", undefined);
      return;
    }
    // Read content from a blob
    if (blob) {
      Promise.all([
        getBlobContent(blob, BlobContentTypes.RAW_BINARY),
        getBlobContent(blob, BlobContentTypes.DATA_URL),
        getBlobContent(blob, BlobContentTypes.TEXT),
      ])
        .then((results) => {
          const recordedFile = {
            contents: {
              ...results[0],
              ...results[1],
              ...results[2],
            },
            size: blob.size,
            type: blob.type,
          };

          // Save the recorded file
          this.props.updateWidgetMetaProperty("recordedFile", recordedFile, {
            triggerPropertyName: "onRecordingComplete",
            dynamicString: this.props.onRecordingComplete,
            event: {
              type: EventType.ON_RECORDING_COMPLETE,
            },
          });
        })
        .catch(() => {
          this.props.updateWidgetMetaProperty("recordedFile", null);
        });
    }
  };

  getPageView() {
    const {
      backgroundColor,
      bottomRow,
      iconColor,
      isDisabled,
      leftColumn,
      parentColumnSpace,
      parentRowSpace,
      recordedFile,
      rightColumn,
      topRow,
    } = this.props;

    return (
      <AudioRecorderComponent
        backgroundColor={backgroundColor}
        height={(bottomRow - topRow) * parentRowSpace}
        iconColor={iconColor}
        isDisabled={isDisabled}
        onRecordingComplete={this.handleRecordingComplete}
        onRecordingStart={this.handleRecordingStart}
        value={recordedFile}
        width={(rightColumn - leftColumn) * parentColumnSpace}
      />
    );
  }

  static getWidgetType(): WidgetType {
    return "AUDIO_RECORDER_WIDGET";
  }
}

export default AudioRecorderWidget;
