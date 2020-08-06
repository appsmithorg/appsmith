import { createReducer } from "utils/AppsmithUtils";
import { ReduxActionTypes, ReduxAction } from "constants/ReduxActionConstants";
import PropertyPaneConfigResponse from "mockResponses/PropertyPaneConfigResponse";
import { PropertyControlPropsType } from "components/propertyControls";
import { WidgetType } from "constants/WidgetConstants";
import { generateReactKey } from "utils/generators";

const generateConfigWithIds = (config: PropertyConfig) => {
  const addObjectId = (obj: any) => {
    obj.id = generateReactKey();
    if (obj.hasOwnProperty("children")) {
      obj.children = obj.children.map(addObjectId);
    }
    return obj;
  };
  Object.keys(config).forEach((widgetType: string) => {
    config[widgetType as WidgetType] = config[widgetType as WidgetType].map(
      addObjectId,
    );
  });
  return config;
};

const initialState: PropertyPaneConfigState = {
  configVersion: 0,
  config: generateConfigWithIds(PropertyPaneConfigResponse.config),
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
