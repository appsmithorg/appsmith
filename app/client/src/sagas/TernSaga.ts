import type { ReduxAction } from "actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getActions, getJSCollections } from "ee/selectors/entitiesSelector";
import type { DefaultRootState } from "react-redux";
import type { RecentEntity } from "components/editorComponents/GlobalSearch/utils";
import type { Datasource } from "entities/Datasource";
import { get } from "lodash";
import { FocusEntity } from "navigation/FocusEntity";
import { select, takeLatest } from "redux-saga/effects";
import { getWidgets } from "./selectors";
import CodemirrorTernService from "utils/autocomplete/CodemirrorTernService";

function* handleSetTernRecentEntities(action: ReduxAction<RecentEntity[]>) {
  const recentEntities = action.payload || [];

  const actions: ReturnType<typeof getActions> = yield select(getActions);
  const jsActions: ReturnType<typeof getJSCollections> =
    yield select(getJSCollections);
  const reducerDatasources: Datasource[] = yield select(
    (state: DefaultRootState) => {
      return state.entities.datasources.list;
    },
  );
  const widgetsMap: ReturnType<typeof getWidgets> = yield select(getWidgets);

  const recentEntityNames = new Set<string>();

  for (const recentEntity of recentEntities) {
    const { id, type } = recentEntity;

    switch (type) {
      case FocusEntity.DATASOURCE: {
        const datasource = reducerDatasources.find(
          (reducerDatasource) => reducerDatasource.id === id,
        );

        if (!datasource) break;

        recentEntityNames.add(datasource.name);
        break;
      }
      case FocusEntity.API:
      case FocusEntity.QUERY: {
        const action = actions.find((action) => action?.config?.id === id);

        if (!action) break;

        recentEntityNames.add(action.config.name);
        break;
      }
      case FocusEntity.JS_OBJECT: {
        const action = jsActions.find((action) => action?.config?.id === id);

        if (!action) break;

        recentEntityNames.add(action.config.name);
        break;
      }
      case FocusEntity.WIDGET: {
        const widget = get(widgetsMap, id, null);

        if (!widget) break;

        recentEntityNames.add(widget.widgetName);
      }
    }
  }

  CodemirrorTernService.updateRecentEntities(Array.from(recentEntityNames));
}

function* handleResetTernRecentEntities() {
  CodemirrorTernService.updateRecentEntities([]);
}

export default function* ternSagas() {
  yield takeLatest(
    ReduxActionTypes.SET_RECENT_ENTITIES,
    handleSetTernRecentEntities,
  );
  yield takeLatest(
    ReduxActionTypes.RESET_RECENT_ENTITIES,
    handleResetTernRecentEntities,
  );
}
