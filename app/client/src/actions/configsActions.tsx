import { ReduxActionTypes } from "../constants/ReduxActionConstants";

export type EditorConfigIdsType = {
  propertyPaneConfigsId?: string;
  widgetCardsPaneId?: string;
  widgetConfigsId?: string;
};

export const fetchEditorConfigs = () => {
  return {
    type: ReduxActionTypes.FETCH_CONFIGS_INIT,
  };
};
