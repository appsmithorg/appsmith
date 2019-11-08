import { createReducer } from "../../utils/AppsmithUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../../constants/ReduxActionConstants";
import { InputControlProps } from "../../components/propertyControls/InputTextControl";
import { DropDownControlProps } from "../../components/propertyControls/DropDownControl";
import { ControlProps } from "../../components/propertyControls/BaseControl";
import { WidgetType } from "../../constants/WidgetConstants";

const initialState: PropertyPaneConfigState = {
  configVersion: 0,
};

export type ControlConfig =
  | InputControlProps
  | DropDownControlProps
  | ControlProps;

export type SectionOrientation = "HORIZONTAL" | "VERTICAL";

export interface PropertySection {
  id: string;
  sectionName?: string;
  orientation?: SectionOrientation;
  children: (ControlConfig | PropertySection)[];
}

export type PropertyConfig = Record<WidgetType, PropertySection[]>;

export interface PropertyPaneConfigState {
  config?: PropertyConfig;
  configVersion: number;
}

const propertyPaneConfigReducer = createReducer(initialState, {
  [ReduxActionTypes.FETCH_PROPERTY_PANE_CONFIGS_SUCCESS]: (
    state: PropertyPaneConfigState,
    action: ReduxAction<PropertyPaneConfigState>,
  ) => {
    return { ...action.payload };
  },
});

export default propertyPaneConfigReducer;
