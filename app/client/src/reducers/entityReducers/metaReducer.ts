import { set, get } from "lodash";
import { createImmerReducer } from "utils/AppsmithUtils";
import { UpdateWidgetMetaPropertyPayload } from "actions/metaActions";

import {
  ReduxActionTypes,
  ReduxAction,
  WidgetReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { Diff } from "deep-diff";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import { isWidget } from "workers/evaluationUtils";

export type MetaState = Record<string, Record<string, unknown>>;

const initialState: MetaState = {};

export const metaReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.UPDATE_META_STATE]: (
    state: MetaState,
    action: ReduxAction<{
      updates: Diff<any, any>[];
      updatedDataTree: DataTree;
    }>,
  ) => {
    const { updatedDataTree, updates } = action.payload;

    // if metaObject is updated in dataTree we also update meta values, to keep meta state in sync.
    if (updates.length) {
      updates.forEach((update) => {
        // if meta field is updated in the dataTree then update metaReducer values.
        if (
          update.kind === "E" &&
          update.path?.length &&
          update.path?.length > 1 &&
          update.path[1] === "meta"
        ) {
          // path eg: Input1.meta.defaultText
          const entity = get(updatedDataTree, update.path[0]);
          const metaPropertyPath = update.path.slice(2);
          if (isWidget(entity) && entity.widgetId && metaPropertyPath.length) {
            set(state, [entity.widgetId, ...metaPropertyPath], update.rhs);
          }
        }
      });
    }
    return state;
  },
  [ReduxActionTypes.SET_META_PROP]: (
    state: MetaState,
    action: ReduxAction<UpdateWidgetMetaPropertyPayload>,
  ) => {
    const next = state;

    set(
      next,
      `${action.payload.widgetId}.${action.payload.propertyName}`,
      action.payload.propertyValue,
    );

    return next;
  },
  [ReduxActionTypes.TABLE_PANE_MOVED]: (
    state: MetaState,
    action: ReduxAction<TableFilterPanePositionConfig>,
  ) => {
    const next = { ...state };
    let widgetMetaProps: Record<string, any> = next[action.payload.widgetId];
    if (widgetMetaProps === undefined) {
      widgetMetaProps = {
        isMoved: true,
        position: { ...action.payload.position },
      };
    } else {
      widgetMetaProps = {
        ...widgetMetaProps,
        isMoved: true,
        position: { ...action.payload.position },
      };
    }
    next[action.payload.widgetId] = widgetMetaProps;
    return next;
  },
  [WidgetReduxActionTypes.WIDGET_DELETE]: (
    state: MetaState,
    action: ReduxAction<{ widgetId: string }>,
  ) => {
    const next = { ...state };
    delete next[action.payload.widgetId];
    return next;
  },
  [ReduxActionTypes.RESET_WIDGET_META]: (
    state: MetaState,
    action: ReduxAction<{ widgetId: string }>,
  ) => {
    const widgetId = action.payload.widgetId;
    const next = { ...state };
    if (widgetId in state) {
      next[widgetId] = {};
      return state;
    }
    return state;
  },
  [ReduxActionTypes.FETCH_PAGE_SUCCESS]: () => {
    return initialState;
  },
  [ReduxActionTypes.FETCH_PUBLISHED_PAGE_SUCCESS]: () => {
    return initialState;
  },
});

interface TableFilterPanePositionConfig {
  widgetId: string;
  isMoved: boolean;
  position: {
    left: number;
    top: number;
  };
}

export default metaReducer;
