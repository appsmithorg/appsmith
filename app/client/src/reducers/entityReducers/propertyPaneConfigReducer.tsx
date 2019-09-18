import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import PropertyPaneConfigResponse from "../../mockResponses/PropertyPaneConfigResponse";
import { InputControlProps } from "../../pages/propertyControls/InputTextControl";
import { DropDownControlProps } from "../../pages/propertyControls/DropDownControl";

const initialState: PropertyPaneConfigState = PropertyPaneConfigResponse;

export type ControlConfig =
  | InputControlProps
  | DropDownControlProps
  | InputControlProps;

export interface PropertySection {
  id: string;
  sectionName: string;
  children: (ControlConfig | PropertySection)[];
}

export interface PropertyPaneConfigState {
  config: {
    BUTTON_WIDGET: PropertySection[];
    TEXT_WIDGET: PropertySection[];
    IMAGE_WIDGET: PropertySection[];
    INPUT_WIDGET: PropertySection[];
    SWITCH_WIDGET: PropertySection[];
    CONTAINER_WIDGET: PropertySection[];
    SPINNER_WIDGET: PropertySection[];
    DATE_PICKER_WIDGET: PropertySection[];
    TABLE_WIDGET: PropertySection[];
    DROP_DOWN_WIDGET: PropertySection[];
    CHECKBOX_WIDGET: PropertySection[];
    RADIO_GROUP_WIDGET: PropertySection[];
    ALERT_WIDGET: PropertySection[];
  };
  configVersion: number;
}

const widgetConfigReducer = createReducer(initialState, {
  [ReduxActionTypes.LOAD_PROPERTY_CONFIG]: (
    state: PropertyPaneConfigState,
    action: ReduxAction<PropertyPaneConfigState>,
  ) => {
    return { ...action.payload };
  },
});

export default widgetConfigReducer;
