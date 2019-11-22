import { ReduxActionTypes } from "../constants/ReduxActionConstants";

export type EditorConfigIdsType = {
  widgetCardsPaneId?: string;
  widgetConfigsId?: string;
};

export const fetchEditorConfigs = () => {
  return {
    type: ReduxActionTypes.FETCH_CONFIGS_INIT,
  };
};
