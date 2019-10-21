import { ReduxActionTypes } from "../constants/ReduxActionConstants";

export type EditorConfigIdsType = {
  propertyPaneConfigsId?: string;
  widgetCardsPaneId?: string;
  widgetConfigsId?: string;
};

export const fetchEditorConfigs = (configsIds: EditorConfigIdsType) => {
  return {
    type: ReduxActionTypes.FETCH_CONFIGS_INIT,
    payload: {
      propertyPaneConfigsId: configsIds.propertyPaneConfigsId,
      widgetCardsPaneId: configsIds.widgetCardsPaneId,
      widgetConfigsId: configsIds.widgetConfigsId,
    },
  };
};
