import type {
  ColumnProperties,
  CompactMode,
  ReactTableFilter,
  TableStyles,
  SortOrderTypes,
} from "./component/Constants";
import type { WidgetProps } from "widgets/BaseWidget";
import type { WithMeta } from "widgets/MetaHOC";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { IconNames } from "@blueprintjs/icons";
import type { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import type { Alignment } from "@blueprintjs/core";
import type { IconName } from "@blueprintjs/icons";
import type { ButtonVariant } from "components/constants";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";

export interface EditableCell {
  column: string;
  index: number;
  value: string | number | null;
  initialValue: string;
  inputValue: string;
  [ORIGINAL_INDEX_KEY]: number;
}

export enum PaginationDirection {
  INITIAL = "INITIAL",
  PREVIOUS_PAGE = "PREVIOUS_PAGE",
  NEXT_PAGE = "NEXT_PAGE",
}

export enum EditableCellActions {
  SAVE = "SAVE",
  DISCARD = "DISCARD",
}

export enum InlineEditingSaveOptions {
  ROW_LEVEL = "ROW_LEVEL",
  TABLE_LEVEL = "TABLE_LEVEL",
  CUSTOM = "CUSTOM",
}

interface AddNewRowProps {
  isAddRowInProgress: boolean;
  allowAddNewRow: boolean;
  onAddNewRowSave: string;
  onAddNewRowDiscard: string;
  defaultNewRow: Record<string, unknown>;
}
export interface TableWidgetProps
  extends WidgetProps,
    WithMeta,
    TableStyles,
    AddNewRowProps {
  pristine: boolean;
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
  frozenColumnIndices: Record<string, number>;
  canFreezeColumn?: boolean;
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
  variant?: TableVariant;
  isEditableCellsValid: Record<string, boolean>;
  selectColumnFilterText?: Record<string, string>;
  isAddRowInProgress: boolean;
  newRow: Record<string, unknown>;
  firstEditableColumnIdByOrder: string;
  enableServerSideFiltering: boolean;
  onTableFilterUpdate: string;
  customIsLoading: boolean;
  customIsLoadingValue: boolean;
}

export enum TableVariantTypes {
  DEFAULT = "DEFAULT",
  VARIANT2 = "VARIANT2",
  VARIANT3 = "VARIANT3",
}

export type TableVariant = keyof typeof TableVariantTypes;

export const ORIGINAL_INDEX_KEY = "__originalIndex__";

export const PRIMARY_COLUMN_KEY_VALUE = "__primaryKey__";

export const DEFAULT_COLUMN_WIDTH = 150;

export const COLUMN_MIN_WIDTH = 60;

export const TABLE_COLUMN_ORDER_KEY = "tableWidgetColumnOrder";

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
  SWITCH = "switch",
  CURRENCY = "currency",
  HTML = "html",
}

export enum ReadOnlyColumnTypes {
  TEXT = "text",
  URL = "url",
  NUMBER = "number",
  IMAGE = "image",
  VIDEO = "video",
  DATE = "date",
  CHECKBOX = "checkbox",
  SWITCH = "switch",
  SELECT = "select",
  HTML = "html",
}

export const ActionColumnTypes = [
  ColumnTypes.BUTTON,
  ColumnTypes.ICON_BUTTON,
  ColumnTypes.MENU_BUTTON,
  ColumnTypes.EDIT_ACTIONS,
];

export const FilterableColumnTypes = [
  ColumnTypes.TEXT,
  ColumnTypes.URL,
  ColumnTypes.NUMBER,
  ColumnTypes.DATE,
  ColumnTypes.SELECT,
  ColumnTypes.CHECKBOX,
  ColumnTypes.SWITCH,
  ColumnTypes.HTML,
];

export const DEFAULT_BUTTON_COLOR = "rgb(3, 179, 101)";

export const DEFAULT_BUTTON_LABEL = "Action";

export const DEFAULT_MENU_VARIANT = "PRIMARY";

export const DEFAULT_MENU_BUTTON_LABEL = "Open menu";

export interface TransientDataPayload {
  [key: string]: string | number | boolean;
  __originalIndex__: number;
}

export interface OnColumnEventArgs {
  rowIndex: number;
  action: string;
  onComplete?: () => void;
  triggerPropertyName: string;
  eventType: EventType;
  row?: Record<string, unknown>;
  additionalData?: Record<string, unknown>;
}

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

export enum MomentDateInputFormat {
  MILLISECONDS = "x",
  SECONDS = "X",
}

export const defaultEditableCell: EditableCell = {
  column: "",
  index: -1,
  inputValue: "",
  value: "",
  initialValue: "",
  [ORIGINAL_INDEX_KEY]: -1,
};

export const DEFAULT_COLUMN_NAME = "Table Column";

export const ALLOW_TABLE_WIDGET_SERVER_SIDE_FILTERING =
  FEATURE_FLAG["release_table_serverside_filtering_enabled"];

export const CUSTOM_LOADING_STATE_ENABLED =
  FEATURE_FLAG["release_table_custom_loading_state_enabled"];

export const FILTER_OPERATORS = {
  CONTAINS: { label: "contains", value: "contains", type: "input" },
  DOES_NOT_CONTAIN: {
    label: "does not contain",
    value: "doesNotContain",
    type: "input",
  },
  STARTS_WITH: {
    label: "starts with",
    value: "startsWith",
    type: "input",
  },
  ENDS_WITH: { label: "ends with", value: "endsWith", type: "input" },
  EMPTY: { label: "empty", value: "empty", type: "" },
  NOT_EMPTY: { label: "not empty", value: "notEmpty", type: "" },
  IS_EXACTLY: { label: "is exactly", value: "isExactly", type: "input" },
  IS_CHECKED: { label: "is checked", value: "isChecked", type: "" },
  IS_UNCHECKED: { label: "is unchecked", value: "isUnChecked", type: "" },
  IS: { label: "is", value: "is", type: "date" },
  IS_BEFORE: { label: "is before", value: "isBefore", type: "date" },
  IS_AFTER: { label: "is after", value: "isAfter", type: "date" },
  IS_NOT: { label: "is not", value: "isNot", type: "date" },
  IS_EQUAL_TO: { label: "is equal to", value: "isEqualTo", type: "input" },
  NOT_EQUAL_TO: { label: "not equal to", value: "notEqualTo", type: "input" },
  GREATER_THAN: {
    label: "greater than",
    value: "greaterThan",
    type: "input",
  },
  GREATER_THAN_EQUAL_TO: {
    label: "greater than or equal to",
    value: "greaterThanEqualTo",
    type: "input",
  },
  LESS_THAN: { label: "less than", value: "lessThan", type: "input" },
  LESS_THAN_EQUAL_TO: {
    label: "less than or equal to",
    value: "lessThanEqualTo",
    type: "input",
  },
};
