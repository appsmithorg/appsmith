import type { Row } from "react-table";
import type { Row as ReactTableRowType } from "react-table";
import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";

import type {
  AddNewRowActions,
  CompactMode,
  ReactTableColumnProps,
  ReactTableFilter,
  StickyType,
} from "./Constants";
import type { EditableCell, TableVariant } from "../constants";

export interface ReactTableComponentProps {
  widgetId: string;
  widgetName: string;
  searchKey: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  isLoading: boolean;
  editMode: boolean;
  editableCell: EditableCell;
  width: number;
  height: number;
  pageSize: number;
  totalRecordsCount?: number;
  tableData: Array<Record<string, unknown>>;
  disableDrag: (disable: boolean) => void;
  onBulkEditDiscard: () => void;
  onBulkEditSave: () => void;
  onRowClick: (rowData: Record<string, unknown>, rowIndex: number) => void;
  selectAllRow: (pageData: Row<Record<string, unknown>>[]) => void;
  unSelectAllRow: (pageData: Row<Record<string, unknown>>[]) => void;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  sortTableColumn: (column: string, asc: boolean) => void;
  nextPageClick: () => void;
  prevPageClick: () => void;
  pageNo: number;
  serverSidePaginationEnabled: boolean;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  multiRowSelection?: boolean;
  hiddenColumns?: string[];
  triggerRowSelection: boolean;
  columnWidthMap?: { [key: string]: number };
  handleResizeColumn: (columnWidthMap: { [key: string]: number }) => void;
  handleReorderColumn: (columnOrder: string[]) => void;
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  columns: ReactTableColumnProps[];
  compactMode?: CompactMode;
  isVisibleSearch?: boolean;
  isVisibleFilters?: boolean;
  isVisibleDownload?: boolean;
  isVisiblePagination?: boolean;
  delimiter: string;
  isSortable?: boolean;
  accentColor: string;
  borderRadius: string;
  boxShadow: string;
  borderColor?: string;
  borderWidth?: number;
  variant?: TableVariant;
  isEditableCellsValid?: Record<string, boolean>;
  primaryColumnId?: string;
  isAddRowInProgress: boolean;
  allowAddNewRow: boolean;
  onAddNewRow: () => void;
  onAddNewRowAction: (
    type: AddNewRowActions,
    onActionComplete: () => void,
  ) => void;
  allowRowSelection: boolean;
  allowSorting: boolean;
  disabledAddNewRowSave: boolean;
  handleColumnFreeze?: (columnName: string, sticky?: StickyType) => void;
  canFreezeColumn?: boolean;
  showConnectDataOverlay: boolean;
  onConnectData: () => void;
}

export interface HeaderComponentProps {
  enableDrag: () => void;
  disableDrag: () => void;
  multiRowSelection?: boolean;
  handleAllRowSelectClick: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
  handleReorderColumn: (columnOrder: string[]) => void;
  columnOrder?: string[];
  accentColor: string;
  borderRadius: string;
  headerGroups: any;
  canFreezeColumn?: boolean;
  editMode: boolean;
  handleColumnFreeze?: (columnName: string, sticky?: StickyType) => void;
  isResizingColumn: React.MutableRefObject<boolean>;
  isSortable?: boolean;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  columns: ReactTableColumnProps[];
  width: number;
  subPage: ReactTableRowType<Record<string, unknown>>[];
  prepareRow: any;
  headerWidth?: number;
  rowSelectionState: 0 | 1 | 2 | null;
  widgetId: string;
}

export interface TableProps {
  width: number;
  pageSize: number;
  widgetId: string;
  widgetName: string;
  searchKey: string;
  isLoading: boolean;
  columnWidthMap?: { [key: string]: number };
  columns: ReactTableColumnProps[];
  data: Array<Record<string, unknown>>;
  totalRecordsCount?: number;
  editMode: boolean;
  editableCell: EditableCell;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  handleResizeColumn: (columnWidthMap: { [key: string]: number }) => void;
  handleReorderColumn: (columnOrder: string[]) => void;
  selectTableRow: (row: {
    original: Record<string, unknown>;
    index: number;
  }) => void;
  pageNo: number;
  updatePageNo: (pageNo: number, event?: EventType) => void;
  multiRowSelection?: boolean;
  isSortable?: boolean;
  nextPageClick: () => void;
  prevPageClick: () => void;
  serverSidePaginationEnabled: boolean;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  disableDrag: () => void;
  enableDrag: () => void;
  toggleAllRowSelect: (
    isSelect: boolean,
    pageData: ReactTableRowType<Record<string, unknown>>[],
  ) => void;
  triggerRowSelection: boolean;
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  compactMode?: CompactMode;
  isVisibleDownload?: boolean;
  isVisibleFilters?: boolean;
  isVisiblePagination?: boolean;
  isVisibleSearch?: boolean;
  delimiter: string;
  accentColor: string;
  borderRadius: string;
  boxShadow: string;
  borderWidth?: number;
  borderColor?: string;
  onBulkEditDiscard: () => void;
  onBulkEditSave: () => void;
  variant?: TableVariant;
  primaryColumnId?: string;
  isAddRowInProgress: boolean;
  allowAddNewRow: boolean;
  onAddNewRow: () => void;
  onAddNewRowAction: (
    type: AddNewRowActions,
    onActionComplete: () => void,
  ) => void;
  disabledAddNewRowSave: boolean;
  handleColumnFreeze?: (columnName: string, sticky?: StickyType) => void;
  canFreezeColumn?: boolean;
  showConnectDataOverlay: boolean;
  onConnectData: () => void;
}
