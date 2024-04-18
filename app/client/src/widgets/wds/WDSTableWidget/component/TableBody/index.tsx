import React from "react";
import type {
  Row as ReactTableRowType,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";
import type { ReactTableColumnProps } from "../Constants";
import type { HeaderComponentProps } from "../Table";
import { StaticTableBody } from "./StaticTableBody";
import { VirtualTableBody } from "./VirtualTableBody";
import type { VirtualTableBodyProps } from "./types";

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
});

export const TableBody = (
  props: VirtualTableBodyProps & BodyContextType & { useVirtual: boolean },
) => {
  const {
    accentColor,
    borderRadius,
    canFreezeColumn,
    columns,
    disableDrag,
    editMode,
    enableDrag,
    handleAllRowSelectClick,
    handleColumnFreeze,
    handleReorderColumn,
    headerGroups,
    isAddRowInProgress,
    isResizingColumn,
    isSortable,
    multiRowSelection,
    prepareRow,
    primaryColumnId,
    rows,
    rowSelectionState,
    selectedRowIndex,
    selectedRowIndices,
    selectTableRow,
    sortTableColumn,
    subPage,
    useVirtual,
    widgetId,
    width,
    ...restOfProps
  } = props;

  return (
    <BodyContext.Provider
      value={{
        accentColor,
        canFreezeColumn,
        disableDrag,
        editMode,
        enableDrag,
        handleAllRowSelectClick,
        handleColumnFreeze,
        handleReorderColumn,
        headerGroups,
        isResizingColumn,
        isSortable,
        rowSelectionState,
        sortTableColumn,
        subPage,
        widgetId,
        isAddRowInProgress,
        borderRadius,
        multiRowSelection,
        prepareRow,
        primaryColumnId,
        selectedRowIndex,
        selectedRowIndices,
        selectTableRow,
        columns,
        width,
        rows,
        getTableBodyProps: props.getTableBodyProps,
        totalColumnsWidth: props.totalColumnsWidth,
      }}
    >
      {useVirtual ? (
        <VirtualTableBody rows={rows} width={width} {...restOfProps} />
      ) : (
        <StaticTableBody rows={rows} {...restOfProps} />
      )}
    </BodyContext.Provider>
  );
};
