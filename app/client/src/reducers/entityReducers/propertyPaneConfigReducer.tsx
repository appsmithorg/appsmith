import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import { PropertyControlPropsType } from "components/propertyControls";
import { WidgetType } from "constants/WidgetConstants";

const initialState: PropertyPaneConfigState = {
  configVersion: 0,
};

export interface PropertySection {
  id: string;
  sectionName: string;
  children: (Partial<PropertyControlPropsType> | PropertySection)[];
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
