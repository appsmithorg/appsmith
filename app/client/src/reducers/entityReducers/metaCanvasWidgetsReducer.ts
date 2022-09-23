import { set, split } from "lodash";

import { createImmerReducer } from "utils/ReducerUtils";
import {
  ReduxActionTypes,
  ReduxAction,
} from "@appsmith/constants/ReduxActionConstants";
import { WidgetProps } from "widgets/BaseWidget";

export type MetaCanvasWidgetsReduxState = {
  [widgetId: string]: FlattenedWidgetProps;
};

export type FlattenedWidgetProps<orType = never> =
  | (WidgetProps & {
      children?: string[];
    })
  | orType;

type MetaWidgetPropertyUpdate = {
  path: string;
  value: unknown;
};

export type ModifyMetaWidgetPayload = {
  addOrUpdate: Record<string, FlattenedWidgetProps>;
  deleteIds: string[];
  propertyUpdates?: MetaWidgetPropertyUpdate[];
};
const initialState: MetaCanvasWidgetsReduxState = {};

const metaCanvasWidgetsReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.MODIFY_META_WIDGETS]: (
    state: MetaCanvasWidgetsReduxState,
    action: ReduxAction<ModifyMetaWidgetPayload>,
  ) => {
    const { addOrUpdate, deleteIds, propertyUpdates } = action.payload;

    Object.entries(addOrUpdate).forEach(([metaWidgetId, widgetProps]) => {
      state[metaWidgetId] = widgetProps;
      state[metaWidgetId].isMetaWidget = true;
    });

    deleteIds.forEach((deleteId) => {
      delete state[deleteId];
    });

    (propertyUpdates || []).forEach(({ path, value }) => {
      const [widgetId, ...propertyPathChunks] = split(path, ".");
      const propertyPath = propertyPathChunks.join(".");
      set(state[widgetId], propertyPath, value);
    });

    return state;
  },
});

export default metaCanvasWidgetsReducer;
