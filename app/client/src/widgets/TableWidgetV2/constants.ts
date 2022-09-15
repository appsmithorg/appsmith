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
import { IconNames } from "@blueprintjs/icons";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { Alignment } from "@blueprintjs/core";
import { IconName } from "@blueprintjs/icons";
import { ButtonVariant } from "components/constants";

export type EditableCell = {
  column: string;
  index: number;
  value: string | number | null;
  initialValue: string;
  inputValue: string;
};

export enum EditableCellActions {
  SAVE = "SAVE",
  DISCARD = "DISCARD",
}

export enum InlineEditingSaveOptions {
  ROW_LEVEL = "ROW_LEVEL",
  TABLE_LEVEL = "TABLE_LEVEL",
  CUSTOM = "CUSTOM",
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
  editableCell?: EditableCell;
  primaryColor: string;
  borderRadius: string;
  boxShadow?: string;
  inlineEditingSaveOption?: InlineEditingSaveOptions;
  showInlineEditingOptionDropdown?: boolean;
  isEditableCellValid: boolean;
}

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
  CHECKBOX = "checkbox",
}

export enum ReadOnlyColumnTypes {
  TEXT = "text",
  URL = "url",
  NUMBER = "number",
  IMAGE = "image",
  VIDEO = "video",
  DATE = "date",
  CHECKBOX = "checkbox",
}

export const DEFAULT_BUTTON_COLOR = "rgb(3, 179, 101)";

export const DEFAULT_BUTTON_LABEL = "Action";

export const DEFAULT_MENU_VARIANT = "PRIMARY";

export const DEFAULT_MENU_BUTTON_LABEL = "Open menu";

export type TransientDataPayload = {
  [key: string]: string | number | boolean;
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

export const ICON_NAMES = Object.keys(IconNames).map(
  (name: string) => IconNames[name as keyof typeof IconNames],
);

export type ButtonColumnActions = ColumnAction & {
  eventType: EventType;
  iconName?: IconName;
  variant: ButtonVariant;
  backgroundColor?: string;
  iconAlign?: Alignment;
  borderRadius?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  boxShadow?: string;
};

export enum DateInputFormat {
  EPOCH = "Epoch",
  MILLISECONDS = "Milliseconds",
}

export const defaultEditableCell = {
  column: "",
  index: -1,
  inputValue: "",
  value: "",
  initialValue: "",
};
