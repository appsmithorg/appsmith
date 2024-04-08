import type {
  TableBodyProps,
  TableBodyPropGetter,
  Row as ReactTableRowType,
} from "react-table";
import type { ReactElementType } from "react-window";

export interface StaticTableProps {
  getTableBodyProps(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
  pageSize: number;
  rows: ReactTableRowType<Record<string, unknown>>[];
  height: number;
  width?: number;
}

export interface VirtualTableBodyProps extends StaticTableProps {
  innerElementType?: ReactElementType;
}
