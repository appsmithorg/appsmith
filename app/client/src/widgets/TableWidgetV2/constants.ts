import {
  ColumnProperties,
  CompactMode,
  ReactTableFilter,
  TableStyles,
  SortOrderTypes,
} from "./component/Constants";
import { WidgetProps } from "widgets/BaseWidget";
import { WithMeta } from "widgets/MetaHOC";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";

export type EditableCell = {
  column: string;
  index: number;
  value: string;
  initialValue: string;
};

export enum EditableCellActions {
  SAVE = "SAVE",
  DISCARD = "DISCARD",
}
export interface TableWidgetProps extends WidgetProps, WithMeta, TableStyles {
  nextPageKey?: string;
  prevPageKey?: string;
  label: string;
  searchText: string;
  defaultSearchText: string;
  defaultSelectedRowIndex?: number | string;
  defaultSelectedRowIndices?: number[] | string;
  tableData: Array<Record<string, unknown>>;
  onPageChange?: string;
  pageSize: number;
  onRowSelected?: string;
  onSearchTextChanged: string;
  onSort: string;
  selectedRowIndex?: number;
  selectedRowIndices: number[];
  serverSidePaginationEnabled?: boolean;
  multiRowSelection?: boolean;
  enableClientSideSearch?: boolean;
  hiddenColumns?: string[];
  columnOrder?: string[];
  columnNameMap?: { [key: string]: string };
  columnTypeMap?: {
    [key: string]: { type: string; format: string; inputFormat?: string };
  };
  columnWidthMap?: { [key: string]: number };
  filters?: ReactTableFilter[];
  compactMode?: CompactMode;
  isSortable?: boolean;
  primaryColumnId?: string;
  primaryColumns: Record<string, ColumnProperties>;
  derivedColumns: Record<string, ColumnProperties>;
  sortOrder: {
    column: string;
    order: SortOrderTypes | null;
  };
  totalRecordsCount?: number;
  transientTableData: {
    [key: string]: Record<string, string>;
  };
  editableCell: EditableCell;
  allowBulkEditActions: boolean;
}

export const getCurrentRowBinding = (
  entityName: string,
  userInput: string,
  withBinding = true,
) => {
  let rowBinding = `${entityName}.sanatizedTableData.map((currentRow) => ( ${userInput}))`;
  if (withBinding) rowBinding = `{{${rowBinding}}}`;
  return rowBinding;
};

export const ORIGINAL_INDEX_KEY = "__originalIndex__";

export const PRIMARY_COLUMN_KEY_VALUE = "__primaryKey__";

export const DEFAULT_COLUMN_WIDTH = 150;

export const COLUMN_MIN_WIDTH = 60;

export enum ColumnTypes {
  TEXT = "text",
  URL = "url",
  NUMBER = "number",
  IMAGE = "image",
  VIDEO = "video",
  DATE = "date",
  BUTTON = "button",
  ICON_BUTTON = "iconButton",
  MENU_BUTTON = "menuButton",
  SELECT = "select",
  EDIT_ACTIONS = "editActions",
}

export enum ReadOnlyColumnTypes {
  TEXT = "text",
  URL = "url",
  NUMBER = "number",
  IMAGE = "image",
  VIDEO = "video",
  DATE = "date",
}

export const DEFAULT_BUTTON_COLOR = "rgb(3, 179, 101)";

export const DEFAULT_BUTTON_LABEL_COLOR = "#FFFFFF";

export const DEFAULT_BUTTON_LABEL = "Action";

export const DEFAULT_MENU_VARIANT = "PRIMARY";

export const DEFAULT_MENU_BUTTON_LABEL = "Open menu";

export type TransientDataPayload = {
  [key: string]: string | number;
  __original_index__: number;
};

export type OnColumnEventArgs = {
  rowIndex: number;
  action: string;
  onComplete?: () => void;
  triggerPropertyName: string;
  eventType: EventType;
  row?: Record<string, unknown>;
};
