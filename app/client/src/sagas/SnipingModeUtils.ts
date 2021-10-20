import { CONFIG as TEXT_WIDGET_CONFIG } from "widgets/TextWidget";
import { CONFIG as TABLE_WIDGET_CONFIG } from "widgets/TableWidget";
import { CONFIG as CHART_WIDGET_CONFIG } from "widgets/ChartWidget";
import { CONFIG as CHECKBOX_WIDGET_CONFIG } from "widgets/CheckboxWidget";
import { CONFIG as RADIO_GROUP_WIDGET_CONFIG } from "widgets/RadioGroupWidget";
import { CONFIG as BUTTON_WIDGET_CONFIG } from "widgets/ButtonWidget";
import { CONFIG as DROPDOWN_WIDGET_CONFIG } from "widgets/DropdownWidget";
import { CONFIG as IMAGE_WIDGET_CONFIG } from "widgets/ImageWidget";
import { CONFIG as VIDEO_WIDGET_CONFIG } from "widgets/VideoWidget";
import { CONFIG as INPUT_WIDGET_CONFIG } from "widgets/InputWidget";
import { CONFIG as MAP_WIDGET_CONFIG } from "widgets/MapWidget";
import { CONFIG as RICH_TEXT_EDITOR_WIDGET_CONFIG } from "widgets/RichTextEditorWidget";
import { CONFIG as DATE_PICKER_WIDGET_2_CONFIG } from "widgets/DatePickerWidget2";
import { CONFIG as SWITCH_WIDGET_CONFIG } from "widgets/SwitchWidget";
import { CONFIG as RATE_WIDGET_CONFIG } from "widgets/RateWidget";
import { CONFIG as IFRAME_WIDGET_CONFIG } from "widgets/IframeWidget";
import { CONFIG as MULTI_SELECT_WIDGET_CONFIG } from "widgets/MultiSelectWidget";
import { CONFIG as FORM_BUTTON_WIDGET_CONFIG } from "widgets/FormButtonWidget";
import { CONFIG as ICON_BUTTON_WIDGET_CONFIG } from "widgets/IconButtonWidget";
import { CONFIG as CHECKBOX_GROUP_WIDGET_CONFIG } from "widgets/CheckboxGroupWidget";
import { CONFIG as FILEPICKER_WIDGET_V2_CONFIG } from "widgets/FilePickerWidgetV2";
import { CONFIG as AUDIO_WIDGET_CONFIG } from "widgets/AudioWidget";
import { CONFIG as AUDIO_RECORDER_WIDGET_CONFIG } from "widgets/AudioRecorderWidget";
import { CONFIG as SINGLE_SELECT_TREE_WIDGET_CONFIG } from "widgets/SingleSelectTreeWidget";
import { CONFIG as MULTI_SELECT_TREE_WIDGET_CONFIG } from "widgets/MultiSelectTreeWidget";
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
  if (selectedWidget.type === CHART_WIDGET_CONFIG.type) {
    const primarySequenceKey = Object.keys(selectedWidget.chartData)[0];
    const suggestedQuery = currentAction?.data?.suggestedWidgets?.find(
      (eachWidget: any) => eachWidget.type === CHART_WIDGET_CONFIG.type,
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

export const WIDGET_TO_SNIPPABLE_PROPERTY_MAP: SnippablePropertyMapType = {
  [AUDIO_WIDGET_CONFIG.type]: {
    property: "url",
    type: SnippedPropertyValueType.DATA,
  },
  [AUDIO_RECORDER_WIDGET_CONFIG.type]: {
    property: "onRecordingStart",
    type: SnippedPropertyValueType.RUN,
  },
  [BUTTON_WIDGET_CONFIG.type]: {
    property: "onClick",
    type: SnippedPropertyValueType.RUN,
  },
  [CHART_WIDGET_CONFIG.type]: {
    property: "chartData",
    type: SnippedPropertyValueType.DATA,
  },
  [CHECKBOX_WIDGET_CONFIG.type]: {
    property: "defaultCheckedState",
    type: SnippedPropertyValueType.DATA,
  },
  [CHECKBOX_GROUP_WIDGET_CONFIG.type]: {
    property: "options",
    type: SnippedPropertyValueType.DATA,
  },
  [DATE_PICKER_WIDGET_2_CONFIG.type]: {
    property: "defaultDate",
    type: SnippedPropertyValueType.DATA,
  },
  [FILEPICKER_WIDGET_V2_CONFIG.type]: {
    property: "onFilesSelected",
    type: SnippedPropertyValueType.RUN,
  },
  [FORM_BUTTON_WIDGET_CONFIG.type]: {
    property: "onClick",
    type: SnippedPropertyValueType.RUN,
  },
  [ICON_BUTTON_WIDGET_CONFIG.type]: {
    property: "onClick",
    type: SnippedPropertyValueType.RUN,
  },
  [IFRAME_WIDGET_CONFIG.type]: {
    property: "source",
    type: SnippedPropertyValueType.DATA,
  },
  [IMAGE_WIDGET_CONFIG.type]: {
    property: "defaultImage",
    type: SnippedPropertyValueType.DATA,
  },
  [INPUT_WIDGET_CONFIG.type]: {
    property: "defaultText",
    type: SnippedPropertyValueType.DATA,
  },
  // [LIST_WIDGET_CONFIG.type]: {
  //   property: "items",
  //   type: SnippedPropertyValueType.DATA,
  // },
  [MAP_WIDGET_CONFIG.type]: {
    property: "defaultMarkers",
    type: SnippedPropertyValueType.DATA,
  },
  [MULTI_SELECT_TREE_WIDGET_CONFIG.type]: {
    property: "options",
    type: SnippedPropertyValueType.DATA,
  },
  [MULTI_SELECT_WIDGET_CONFIG.type]: {
    property: "options",
    type: SnippedPropertyValueType.DATA,
  },
  [RADIO_GROUP_WIDGET_CONFIG.type]: {
    property: "options",
    type: SnippedPropertyValueType.DATA,
  },
  [RATE_WIDGET_CONFIG.type]: {
    property: "onRateChanged",
    type: SnippedPropertyValueType.RUN,
  },
  [RICH_TEXT_EDITOR_WIDGET_CONFIG.type]: {
    property: "defaultText",
    type: SnippedPropertyValueType.DATA,
  },
  [DROPDOWN_WIDGET_CONFIG.type]: {
    property: "options",
    type: SnippedPropertyValueType.DATA,
  },
  [SWITCH_WIDGET_CONFIG.type]: {
    property: "defaultSwitchState",
    type: SnippedPropertyValueType.DATA,
  },
  [TABLE_WIDGET_CONFIG.type]: {
    property: "tableData",
    type: SnippedPropertyValueType.DATA,
  },
  [TEXT_WIDGET_CONFIG.type]: {
    property: "text",
    type: SnippedPropertyValueType.DATA,
  },
  [SINGLE_SELECT_TREE_WIDGET_CONFIG.type]: {
    property: "options",
    type: SnippedPropertyValueType.DATA,
  },
  [VIDEO_WIDGET_CONFIG.type]: {
    property: "url",
    type: SnippedPropertyValueType.DATA,
  },
};
