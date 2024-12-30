import type { TableProps as RcTableProps } from "rc-table";
import type { DataIndex } from "rc-table/es/interface";
import type { ColumnType, DefaultRecordType } from "rc-table/lib/interface";

export interface TableColumn<T extends DefaultRecordType>
  extends ColumnType<T> {
  // the key for sorting columns with objects. possible to pass both a simple `key` and `key.key` for nested object.
  sortBy?: string;
  // By default, the columns are sortable. Explicitly passing isSortable === false makes the column non-sortable,
  isSortable?: boolean;
}

export type TableProps<T extends DefaultRecordType> = Omit<
  RcTableProps<T>,
  "styles" | "components" | "columns"
> & {
  columns: TableColumn<T>[];
  sortBy?: string;
  isSortable?: boolean;
};

export interface TableSorter {
  field?: DataIndex;
  order?: "desc" | "asc";
  path?: string | DataIndex;
}
