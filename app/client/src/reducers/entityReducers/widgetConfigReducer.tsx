import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";
import WidgetConfigResponse from "mockResponses/WidgetConfigResponse";
import { ButtonWidgetProps } from "widgets/ButtonWidget";
import { TextWidgetProps } from "widgets/TextWidget";
import { ContainerWidgetProps } from "widgets/ContainerWidget";
import { ImageWidgetProps } from "widgets/ImageWidget";
import { InputWidgetProps } from "widgets/InputWidget";
import { RichTextEditorWidgetProps } from "widgets/RichTextEditorWidget";
import { DatePickerWidgetProps } from "../../widgets/DatePickerWidget";
import { TableWidgetProps } from "../../widgets/TableWidget";
import { DropdownWidgetProps } from "../../widgets/DropdownWidget";
import { CheckboxWidgetProps } from "../../widgets/CheckboxWidget";
import { RadioGroupWidgetProps } from "../../widgets/RadioGroupWidget";
import { AlertWidgetProps } from "../../widgets/AlertWidget";
import { FilePickerWidgetProps } from "../../widgets/FilepickerWidget";
import {
  TabsWidgetProps,
  TabContainerWidgetProps,
} from "../../widgets/TabsWidget";
import { ChartWidgetProps } from "../../widgets/ChartWidget";
import { FormWidgetProps } from "widgets/FormWidget";
import { FormButtonWidgetProps } from "widgets/FormButtonWidget";
import { MapWidgetProps } from "widgets/MapWidget";
import { ModalWidgetProps } from "widgets/ModalWidget";
import { IconWidgetProps } from "widgets/IconWidget";
import { VideoWidgetProps } from "widgets/VideoWidget";

const initialState: WidgetConfigReducerState = WidgetConfigResponse;

export type WidgetBlueprint = {
  view?: Array<{
    type: string;
    size?: { rows: number; cols: number };
    position: { top?: number; left?: number };
    props: Record<string, any>;
  }>;
  operations?: any;
};

export interface WidgetConfigProps {
  rows: number;
  columns: number;
  blueprint?: WidgetBlueprint;
  widgetName: string;
}

export interface WidgetConfigReducerState {
  config: {
    BUTTON_WIDGET: Partial<ButtonWidgetProps> & WidgetConfigProps;
    TEXT_WIDGET: Partial<TextWidgetProps> & WidgetConfigProps;
    IMAGE_WIDGET: Partial<ImageWidgetProps> & WidgetConfigProps;
    INPUT_WIDGET: Partial<InputWidgetProps> & WidgetConfigProps;
    RICH_TEXT_EDITOR_WIDGET: Partial<RichTextEditorWidgetProps> &
      WidgetConfigProps;
    CONTAINER_WIDGET: Partial<ContainerWidgetProps<WidgetProps>> &
      WidgetConfigProps;
    DATE_PICKER_WIDGET: Partial<DatePickerWidgetProps> & WidgetConfigProps;
    TABLE_WIDGET: Partial<TableWidgetProps> & WidgetConfigProps;
    VIDEO_WIDGET: Partial<VideoWidgetProps> & WidgetConfigProps;
    DROP_DOWN_WIDGET: Partial<DropdownWidgetProps> & WidgetConfigProps;
    CHECKBOX_WIDGET: Partial<CheckboxWidgetProps> & WidgetConfigProps;
    RADIO_GROUP_WIDGET: Partial<RadioGroupWidgetProps> & WidgetConfigProps;
    ALERT_WIDGET: Partial<AlertWidgetProps> & WidgetConfigProps;
    FILE_PICKER_WIDGET: Partial<FilePickerWidgetProps> & WidgetConfigProps;
    TABS_WIDGET: Partial<TabsWidgetProps<TabContainerWidgetProps>> &
      WidgetConfigProps;
    MODAL_WIDGET: Partial<ModalWidgetProps> & WidgetConfigProps;
    CHART_WIDGET: Partial<ChartWidgetProps> & WidgetConfigProps;
    FORM_WIDGET: Partial<FormWidgetProps> & WidgetConfigProps;
    FORM_BUTTON_WIDGET: Partial<FormButtonWidgetProps> & WidgetConfigProps;
    MAP_WIDGET: Partial<MapWidgetProps> & WidgetConfigProps;
    CANVAS_WIDGET: Partial<ContainerWidgetProps<WidgetProps>> &
      WidgetConfigProps;
    ICON_WIDGET: Partial<IconWidgetProps> & WidgetConfigProps;
  };
  configVersion: number;
}

const widgetConfigReducer = createReducer(initialState, {
  [ReduxActionTypes.LOAD_WIDGET_CONFIG]: (
    state: WidgetConfigReducerState,
    action: ReduxAction<WidgetConfigReducerState>,
  ) => {
    return { ...action.payload };
  },
});

export default widgetConfigReducer;
