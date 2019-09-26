import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import PropertyPaneConfigResponse from "../../mockResponses/PropertyPaneConfigResponse";
import { InputControlProps } from "../../propertyControls/InputTextControl";
import { DropDownControlProps } from "../../propertyControls/DropDownControl";
import { ControlProps } from "../../propertyControls/BaseControl";

const initialState: PropertyPaneConfigState = PropertyPaneConfigResponse;

export type ControlConfig =
  | InputControlProps
  | DropDownControlProps
  | InputControlProps
  | ControlProps;

export type SectionOrientation = "HORIZONTAL" | "VERTICAL";

export interface PropertySection {
  id: string;
  sectionName?: string;
  orientation?: SectionOrientation;
  children: (ControlConfig | PropertySection)[];
}

export interface PropertyConfig {
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
}

export interface PropertyPaneConfigState {
  config: PropertyConfig;
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
