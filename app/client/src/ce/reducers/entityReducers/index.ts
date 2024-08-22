import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import actionsReducer from "ee/reducers/entityReducers/actionsReducer";
import jsActionsReducer from "ee/reducers/entityReducers/jsActionsReducer";

/* Reducers which are integrated into the core system when registering a pluggable module
    or done so by a module that is designed to be eventually pluggable */
import layoutElementPositionsReducer from "layoutSystems/anvil/integrations/reducers/layoutElementPositionsReducer";
import appReducer from "reducers/entityReducers/appReducer";
import autoHeightLayoutTreeReducer from "reducers/entityReducers/autoHeightReducers/autoHeightLayoutTreeReducer";
import canvasLevelsReducer from "reducers/entityReducers/autoHeightReducers/canvasLevelsReducer";
import canvasWidgetsReducer from "reducers/entityReducers/canvasWidgetsReducer";
import canvasWidgetsStructureReducer from "reducers/entityReducers/canvasWidgetsStructureReducer";
import datasourceReducer from "reducers/entityReducers/datasourceReducer";
import metaReducer from "reducers/entityReducers/metaReducer";
import metaWidgetsReducer from "reducers/entityReducers/metaWidgetsReducer";
import pageListReducer from "reducers/entityReducers/pageListReducer";
import pluginsReducer from "reducers/entityReducers/pluginsReducer";

import type { AppState } from "..";

export const entityReducerObject = {
  canvasWidgets: canvasWidgetsReducer,
  canvasWidgetsStructure: canvasWidgetsStructureReducer,
  metaWidgets: metaWidgetsReducer,
  actions: actionsReducer,
  datasources: datasourceReducer,
  pageList: pageListReducer,
  plugins: pluginsReducer,
  meta: metaReducer,
  app: appReducer,
  jsActions: jsActionsReducer,
  autoHeightLayoutTree: autoHeightLayoutTreeReducer,
  canvasLevels: canvasLevelsReducer,
  layoutElementPositions: layoutElementPositionsReducer,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  moduleInstanceEntities: (state: AppState, action: ReduxAction<any>) => {
    return {};
  },
};
