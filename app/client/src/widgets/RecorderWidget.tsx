import React from "react";
import * as Sentry from "@sentry/react";

import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import withMeta, { WithMeta } from "./MetaHOC";
import RecorderComponent from "components/designSystems/appsmith/RecorderComponent";

export interface RecorderWidgetProps extends WidgetProps, WithMeta {
  backgroundColor: string;
  iconColor: string;
  isDisabled: boolean;
  isValid: boolean;
  onRecordingStart?: string;
  onRecordingComplete?: string;
}

class RecorderWidget extends BaseWidget<RecorderWidgetProps, WidgetState> {
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
      value: undefined,
    };
  }

  handleRecordingStart = () => {
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
      this.props.updateWidgetMetaProperty("value", undefined);
      return;
    }
    this.props.updateWidgetMetaProperty("value", blob, {
      triggerPropertyName: "onRecordingComplete",
      dynamicString: this.props.onRecordingComplete,
      event: {
        type: EventType.ON_RECORDING_COMPLETE,
      },
    });
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
      rightColumn,
      topRow,
      widgetId,
    } = this.props;

    return (
      <RecorderComponent
        backgroundColor={backgroundColor}
        height={(bottomRow - topRow) * parentRowSpace}
        iconColor={iconColor}
        isDisabled={isDisabled}
        onRecordingComplete={this.handleRecordingComplete}
        onRecordingStart={this.handleRecordingStart}
        widgetId={widgetId}
        width={(rightColumn - leftColumn) * parentColumnSpace}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "RECORDER_WIDGET";
  }
}

export default RecorderWidget;
export const ProfiledRecorderWidget = Sentry.withProfiler(
  withMeta(RecorderWidget),
);
