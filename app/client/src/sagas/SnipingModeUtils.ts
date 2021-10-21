import WidgetFactory from "utils/WidgetFactory";

const WidgetTypes = WidgetFactory.widgetTypes;
import { SNIPING_FOR_CHART_FAILED } from "../constants/messages";

export enum SnippedPropertyValueType {
  DATA = "DATA",
  RUN = "RUN",
}

export interface WidgetPropsType {
  property: string;
  type: SnippedPropertyValueType;
}
export interface SnippablePropertyMapType {
  [k: string]: WidgetPropsType;
}

export const getPropertyValueFromType = (
  widgetProps: WidgetPropsType,
  currentAction: any,
  selectedWidget: any,
) => {
  // This is special condition for widgets
  if (selectedWidget.type === WidgetTypes.CHART_WIDGET) {
    const primarySequenceKey = Object.keys(selectedWidget.chartData)[0];
    const suggestedQuery = currentAction?.data?.suggestedWidgets?.find(
      (eachWidget: any) => eachWidget.type === WidgetTypes.CHART_WIDGET,
    )?.bindingQuery;
    return {
      isValid: !!suggestedQuery,
      propertyValue: {
        [primarySequenceKey]: {
          data: `{{${currentAction.config.name}.${suggestedQuery}}}`,
          seriesName: "Demo",
        },
      },
      isJsMode: false,
      errorMessage: SNIPING_FOR_CHART_FAILED(),
    };
  } else {
    return {
      isValid: true,
      propertyValue: `{{${currentAction.config.name}.${
        widgetProps.type === SnippedPropertyValueType.DATA ? "data" : "run()"
      }}}`,
      isJsMode: true,
    };
  }
};

export const getWidgetSnappableProps = (type: string) => {
  const WIDGET_TO_SNIPPABLE_PROPERTY_MAP: SnippablePropertyMapType = {
    [WidgetTypes.AUDIO_WIDGET]: {
      property: "url",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.AUDIO_RECORDER_WIDGET]: {
      property: "onRecordingStart",
      type: SnippedPropertyValueType.RUN,
    },
    [WidgetTypes.BUTTON_WIDGET]: {
      property: "onClick",
      type: SnippedPropertyValueType.RUN,
    },
    [WidgetTypes.CHART_WIDGET]: {
      property: "chartData",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.CHECKBOX_WIDGET]: {
      property: "defaultCheckedState",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.CHECKBOX_GROUP_WIDGET]: {
      property: "options",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.DATE_PICKER_WIDGET]: {
      property: "defaultDate",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.DATE_PICKER_WIDGET2]: {
      property: "defaultDate",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.FILE_PICKER_WIDGET]: {
      property: "onFilesSelected",
      type: SnippedPropertyValueType.RUN,
    },
    [WidgetTypes.FILE_PICKER_WIDGET_V2]: {
      property: "onFilesSelected",
      type: SnippedPropertyValueType.RUN,
    },
    [WidgetTypes.FORM_BUTTON_WIDGET]: {
      property: "onClick",
      type: SnippedPropertyValueType.RUN,
    },
    [WidgetTypes.ICON_BUTTON_WIDGET]: {
      property: "onClick",
      type: SnippedPropertyValueType.RUN,
    },
    [WidgetTypes.IFRAME_WIDGET]: {
      property: "source",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.IMAGE_WIDGET]: {
      property: "defaultImage",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.INPUT_WIDGET]: {
      property: "defaultText",
      type: SnippedPropertyValueType.DATA,
    },
    // [WidgetTypes.LIST_WIDGET]: {
    //   property: "items",
    //   type: SnippedPropertyValueType.DATA,
    // },
    [WidgetTypes.MAP_WIDGET]: {
      property: "defaultMarkers",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.MULTI_SELECT_TREE_WIDGET]: {
      property: "options",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.MULTI_SELECT_WIDGET]: {
      property: "options",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.RADIO_GROUP_WIDGET]: {
      property: "options",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.RATE_WIDGET]: {
      property: "onRateChanged",
      type: SnippedPropertyValueType.RUN,
    },
    [WidgetTypes.RICH_TEXT_EDITOR_WIDGET]: {
      property: "defaultText",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.DROP_DOWN_WIDGET]: {
      property: "options",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.SWITCH_WIDGET]: {
      property: "defaultSwitchState",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.TABLE_WIDGET]: {
      property: "tableData",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.TEXT_WIDGET]: {
      property: "text",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.SINGLE_SELECT_TREE_WIDGET]: {
      property: "options",
      type: SnippedPropertyValueType.DATA,
    },
    [WidgetTypes.VIDEO_WIDGET]: {
      property: "url",
      type: SnippedPropertyValueType.DATA,
    },
  };
  return WIDGET_TO_SNIPPABLE_PROPERTY_MAP[type];
};
