import type { TableProps as RcTableProps } from "rc-table";
import type { DefaultRecordType } from "rc-table/lib/interface";

export type TableProps<T extends DefaultRecordType> = Omit<
  RcTableProps<T>,
  "styles" | "components"
>;
