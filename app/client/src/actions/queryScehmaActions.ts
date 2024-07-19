import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";

import type {
  Columns,
  ColumnMeta,
} from "reducers/uiReducers/querySchemaReducer";

export const initQuerySchema = (payload: { id: string; columns: Columns }) => {
  return {
    type: ReduxActionTypes.SET_QUERY_SCHEMA_COLUMNS,
    payload,
  };
};

export const updateQuerySchemaColumn = (payload: {
  id: string;
  columnName: string;
  column: ColumnMeta;
}) => {
  return {
    type: ReduxActionTypes.UPDATE_QUERY_SCHEMA_COLUMN,
    payload,
  };
};
