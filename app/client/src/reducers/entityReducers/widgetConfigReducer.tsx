import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import { WidgetProps } from "../../widgets/BaseWidget";
import WidgetConfigResponse from "../../mockResponses/WidgetConfigResponse";
import { ButtonWidgetProps } from "../../widgets/ButtonWidget";
import { TextWidgetProps } from "../../widgets/TextWidget";
import { ContainerWidgetProps } from "../../widgets/ContainerWidget";
import { ImageWidgetProps } from "../../widgets/ImageWidget";
import { InputWidgetProps } from "../../widgets/InputWidget";
import { SwitchWidgetProps } from "../../widgets/SwitchWidget";
import { SpinnerWidgetProps } from "../../widgets/SpinnerWidget";
import { DatePickerWidgetProps } from "../../widgets/DatePickerWidget";
import { TableWidgetProps } from "../../widgets/TableWidget";
import { DropdownWidgetProps } from "../../widgets/DropdownWidget";
import { CheckboxWidgetProps } from "../../widgets/CheckboxWidget";
import { RadioGroupWidgetProps } from "../../widgets/RadioGroupWidget";
import { AlertWidgetProps } from "../../widgets/AlertWidget";
import { FilePickerWidgetProps } from "../../widgets/FilepickerWidget";

const initialState: WidgetConfigReducerState = WidgetConfigResponse;

export interface WidgetConfigProps {
  rows: number;
  columns: number;
}

export interface WidgetConfigReducerState {
  config: {
    BUTTON_WIDGET: Partial<ButtonWidgetProps> & WidgetConfigProps;
    TEXT_WIDGET: Partial<TextWidgetProps> & WidgetConfigProps;
    IMAGE_WIDGET: Partial<ImageWidgetProps> & WidgetConfigProps;
    INPUT_WIDGET: Partial<InputWidgetProps> & WidgetConfigProps;
    SWITCH_WIDGET: Partial<SwitchWidgetProps> & WidgetConfigProps;
    CONTAINER_WIDGET: Partial<ContainerWidgetProps<WidgetProps>> &
      WidgetConfigProps;
    SPINNER_WIDGET: Partial<SpinnerWidgetProps> & WidgetConfigProps;
    DATE_PICKER_WIDGET: Partial<DatePickerWidgetProps> & WidgetConfigProps;
    TABLE_WIDGET: Partial<TableWidgetProps> & WidgetConfigProps;
    DROP_DOWN_WIDGET: Partial<DropdownWidgetProps> & WidgetConfigProps;
    CHECKBOX_WIDGET: Partial<CheckboxWidgetProps> & WidgetConfigProps;
    RADIO_GROUP_WIDGET: Partial<RadioGroupWidgetProps> & WidgetConfigProps;
    ALERT_WIDGET: Partial<AlertWidgetProps> & WidgetConfigProps;
    FILE_PICKER_WIDGET: Partial<FilePickerWidgetProps> & WidgetConfigProps;
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
