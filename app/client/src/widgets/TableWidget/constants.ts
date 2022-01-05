import {
  ColumnProperties,
  CompactMode,
  ReactTableFilter,
  TableStyles,
  SortOrderTypes,
} from "./component/Constants";
import { WidgetProps } from "widgets/BaseWidget";
import { WithMeta } from "widgets/MetaHOC";

export interface TableWidgetProps extends WidgetProps, WithMeta, TableStyles {
  nextPageKey?: string;
  prevPageKey?: string;
  label: string;
  searchText: string;
  defaultSearchText: string;
  defaultSelectedRow?: number | number[] | string;
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
  columnSizeMap?: { [key: string]: number };
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
