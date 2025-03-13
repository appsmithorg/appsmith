import React, { type RefObject } from "react";
import type {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import type { VariableSizeList } from "react-window";
import type { ReactTableColumnProps } from "../Constants";
import type { HeaderComponentProps } from "../Table";

export type BodyContextType = {
  accentColor: string;
  borderRadius: string;
  multiRowSelection: boolean;
  prepareRow?(row: ReactTableRowType<Record<string, unknown>>): void;
  selectTableRow?: (row: {
    original: Record<string, unknown>;
    index: number;
  }) => void;
  selectedRowIndex: number;
  selectedRowIndices: number[];
  columns: ReactTableColumnProps[];
  width: number;
  rows: ReactTableRowType<Record<string, unknown>>[];
  primaryColumnId?: string;
  isAddRowInProgress: boolean;
  getTableBodyProps?(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
  totalColumnsWidth?: number;
  rowHeights: RefObject<{ [key: number]: number }>;
  rowNeedsMeasurement: RefObject<{ [key: number]: boolean }>;
  listRef: RefObject<VariableSizeList> | null;
} & Partial<HeaderComponentProps>;

export const BodyContext = React.createContext<BodyContextType>({
  accentColor: "",
  borderRadius: "",
  multiRowSelection: false,
  selectedRowIndex: -1,
  selectedRowIndices: [],
  columns: [],
  width: 0,
  rows: [],
  primaryColumnId: "",
  isAddRowInProgress: false,
  totalColumnsWidth: 0,
  rowHeights: { current: {} },
  rowNeedsMeasurement: { current: {} },
  listRef: null,
});
