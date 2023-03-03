import { fork, put, select, take } from "redux-saga/effects";
import { RouteChangeActionPayload } from "actions/focusHistoryActions";
import {
  FocusEntity,
  FocusEntityInfo,
  identifyEntityFromPath,
} from "navigation/FocusEntity";
import log from "loglevel";
import { Location } from "history";
import { AppsmithLocationState } from "utils/history";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getRecentEntityIds } from "selectors/globalSearchSelectors";
import {
  ReduxAction,
  ReduxActionTypes,
} from "ce/constants/ReduxActionConstants";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { BackgroundTheme, changeAppBackground } from "sagas/ThemeSaga";
import { updateRecentEntitySaga } from "sagas/GlobalSearchSagas";
import { isEditorPath } from "@appsmith/pages/Editor/Explorer/helpers";
// import {
//   setLastSelectedWidget,
//   setSelectedWidgets,
// } from "actions/widgetSelectionActions";
// import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import {
  contextSwitchingSaga,
  isPageChange,
} from "ce/sagas/ContextSwitchingSaga";
import {
  getActions,
  getDatasources,
  getJSCollections,
} from "selectors/entitiesSelector";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { Datasource } from "entities/Datasource";
import { AppState } from "../reducers";
import { EditorTab } from "../../reducers/uiReducers/editorTabsReducer";
import { JSCollectionDataState } from "../../reducers/entityReducers/jsActionsReducer";
import { getIsEditorInitialized } from "../../selectors/editorSelectors";

let previousPath: string;

export function* handleRouteChange(
  action: ReduxAction<RouteChangeActionPayload>,
) {
  const { pathname, state } = action.payload.location;
  try {
    const isAnEditorPath = isEditorPath(pathname);

    // handled only on edit mode
    if (isAnEditorPath) {
      yield fork(logNavigationAnalytics, action.payload);
      const entityInfo = identifyEntityFromPath(pathname);
      yield fork(
        updateEditorTabsSaga,
        entityInfo,
        isPageChange(pathname, previousPath),
      );
      yield fork(contextSwitchingSaga, pathname, previousPath, state);
      yield fork(appBackgroundHandler);
      yield fork(updateRecentEntitySaga, entityInfo);
      // yield fork(setSelectedWidgetsSaga);
    }
  } catch (e) {
    log.error("Error in focus change", e);
  } finally {
    previousPath = pathname;
  }
}

function* appBackgroundHandler() {
  const currentTheme: BackgroundTheme = yield select(getCurrentThemeDetails);
  changeAppBackground(currentTheme);
}

function* logNavigationAnalytics(payload: {
  location: Location<AppsmithLocationState>;
}) {
  const {
    location: { pathname, state },
  } = payload;
  const recentEntityIds: Array<string> = yield select(getRecentEntityIds);
  const currentEntity = identifyEntityFromPath(pathname);
  const previousEntity = identifyEntityFromPath(previousPath);
  const isRecent = recentEntityIds.some(
    (entityId) => entityId === currentEntity.id,
  );
  AnalyticsUtil.logEvent("ROUTE_CHANGE", {
    toPath: pathname,
    fromPath: previousPath || undefined,
    navigationMethod: state?.invokedBy,
    isRecent,
    recentLength: recentEntityIds.length,
    toType: currentEntity.entity,
    fromType: previousEntity.entity,
  });
}

// function* setSelectedWidgetsSaga() {
//   const pathname = window.location.pathname;
//   const entityInfo = identifyEntityFromPath(pathname);
//   let widgets: string[] | undefined;
//   let lastSelectedWidget: string | undefined;
//   if (entityInfo.entity === FocusEntity.PROPERTY_PANE) {
//     widgets = entityInfo.id.split(",");
//     if (widgets.length) {
//       lastSelectedWidget = widgets[widgets.length - 1];
//     }
//   } else if (entityInfo.entity === FocusEntity.CANVAS) {
//     widgets = [];
//     lastSelectedWidget = MAIN_CONTAINER_WIDGET_ID;
//   }
//   if (Array.isArray(widgets)) {
//     yield put(setSelectedWidgets(widgets));
//   }
//   if (lastSelectedWidget) {
//     yield put(setLastSelectedWidget(lastSelectedWidget));
//   }
// }

function* updateEditorTabsSaga(
  entityInfo: FocusEntityInfo,
  isPageChange: boolean,
) {
  if (isPageChange) {
    yield put({
      type: ReduxActionTypes.SET_EDITOR_TABS,
      payload: [],
    });
  }
  if (
    [
      FocusEntity.CANVAS,
      FocusEntity.NONE,
      FocusEntity.PAGE,
      FocusEntity.PROPERTY_PANE,
    ].indexOf(entityInfo.entity) !== -1
  ) {
    return;
  }
  let name = "";
  const isEditorInitialised: boolean = yield select(getIsEditorInitialized);

  if (!isEditorInitialised) {
    take(ReduxActionTypes.FETCH_ACTIONS_SUCCESS);
  }

  const actions: ActionDataState = yield select(getActions);
  const jsObjects: JSCollectionDataState = yield select(getJSCollections);
  const datasources: Datasource[] = yield select(getDatasources);

  switch (entityInfo.entity) {
    case FocusEntity.API:
    case FocusEntity.QUERY: {
      const api = actions.find((action) => action.config.id === entityInfo.id);
      if (api) {
        name = api.config.name;
      }
      break;
    }
    case FocusEntity.JS_OBJECT: {
      const jsObject = jsObjects.find((js) => js.config.id === entityInfo.id);
      if (jsObject) {
        name = jsObject.config.name;
      }
      break;
    }
    case FocusEntity.DATASOURCE: {
      const datasource = datasources.find((ds) => ds.id === entityInfo.id);
      if (datasource) {
        name = datasource.name;
      }
    }
  }

  if (!name || name === "") return;

  const currentTabs: Array<EditorTab> = yield select(
    (state: AppState) => state.ui.editorTabs.openTabs,
  );

  const newTab: EditorTab = {
    id: entityInfo.id,
    name,
    entityType: entityInfo.entity,
  };

  const alreadyOpen = currentTabs.find((tab) => tab.id === newTab.id);

  const newTabs = [...currentTabs];
  if (!alreadyOpen) {
    newTabs.push(newTab);
    yield put({
      type: ReduxActionTypes.SET_EDITOR_TABS,
      payload: newTabs,
    });
  }
}
