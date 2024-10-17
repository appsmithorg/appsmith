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
  userDefinedIsLoading: boolean;
  userDefinedIsLoadingValue: boolean;
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
