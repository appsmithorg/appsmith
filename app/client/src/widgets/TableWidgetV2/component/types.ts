import type { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import type { ReactNode } from "react";
import type { Row as ReactTableRowType } from "react-table";
import type { EditableCell, TableVariant } from "../constants";
import type {
  AddNewRowActions,
  CompactMode,
  ReactTableColumnProps,
  ReactTableFilter,
  StickyType,
} from "./Constants";

export interface TableProps {
  width: number;
  height: number;
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  searchTableData: (searchKey: any) => void;
  filters?: ReactTableFilter[];
  applyFilter: (filters: ReactTableFilter[]) => void;
  compactMode: CompactMode;
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
  isInfiniteScrollEnabled: boolean;
  endOfData: boolean;
}

export interface TableProviderProps extends TableProps {
  children: ReactNode;
  currentPageIndex: number;
}
