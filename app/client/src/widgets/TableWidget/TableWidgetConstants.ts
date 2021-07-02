import {
  ColumnProperties,
  CompactMode,
  ReactTableFilter,
  TableStyles,
} from "components/designSystems/appsmith/TableComponent/Constants";
import { WidgetProps } from "widgets/BaseWidget";
import { WithMeta } from "widgets/MetaHOC";

export interface TableWidgetProps extends WidgetProps, WithMeta, TableStyles {
  nextPageKey?: string;
  prevPageKey?: string;
  label: string;
  searchText: string;
  defaultSearchText: string;
  defaultSelectedRow?: number | number[];
  tableData: Array<Record<string, unknown>>;
  onPageChange?: string;
  pageSize: number;
  onRowSelected?: string;
  onSearchTextChanged: string;
  selectedRowIndex?: number;
  selectedRowIndices: number[];
  serverSidePaginationEnabled?: boolean;
  multiRowSelection?: boolean;
  hiddenColumns?: string[];
  columnOrder?: string[];
  columnNameMap?: { [key: string]: string };
  columnTypeMap?: {
    [key: string]: { type: string; format: string; inputFormat?: string };
  };
  columnSizeMap?: { [key: string]: number };
  filters?: ReactTableFilter[];
  compactMode?: CompactMode;
  primaryColumns: Record<string, ColumnProperties>;
  derivedColumns: Record<string, ColumnProperties>;
  sortedColumn?: {
    column: string;
    asc: boolean;
  };
}

export const getCurrentRowBinding = (entityName: string, userInput: string) =>
  `${entityName}.sanatizedTableData.map((currentRow) => ( ${userInput} ))`;
