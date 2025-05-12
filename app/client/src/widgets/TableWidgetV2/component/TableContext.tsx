import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { TableProps } from "./types";
import {
  SCROLL_BAR_OFFSET,
  TABLE_SCROLLBAR_HEIGHT,
  TABLE_SIZES,
  type TableSizes,
} from "./Constants";
import type {
  HeaderGroup,
  Row,
  TableBodyPropGetter,
  TableBodyProps,
} from "react-table";

export interface TableProviderProps extends TableProps {
  children: ReactNode;
  currentPageIndex: number;
  pageCount: number;
  pageOptions: number[];
  isHeaderVisible: boolean;
  handleAllRowSelectClick: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => void;
  headerGroups: HeaderGroup[];
  totalColumnsWidth: number;
  isResizingColumn: React.MutableRefObject<boolean>;
  prepareRow: (row: Row<Record<string, unknown>>) => void;
  rowSelectionState: 0 | 1 | 2 | null;
  subPage: Row<Record<string, unknown>>[];
  getTableBodyProps(
    propGetter?: TableBodyPropGetter<Record<string, unknown>> | undefined,
  ): TableBodyProps;
}

export interface TableContextState
  extends Omit<TableProviderProps, "children"> {
  scrollContainerStyles: {
    height: number;
    width: number;
  };
  tableSizes: TableSizes;
  focusFirstEditableCellInNewRow: () => void;
}

export const TableContext = createContext<TableContextState | undefined>(
  undefined,
);

export const TableProvider = ({ children, ...state }: TableProviderProps) => {
  const value = useMemo(() => state, [state]);
  const tableSizes = TABLE_SIZES[state.compactMode];

  const scrollContainerStyles = useMemo(() => {
    return {
      height: state.isHeaderVisible
        ? state.height - tableSizes.TABLE_HEADER_HEIGHT - TABLE_SCROLLBAR_HEIGHT
        : state.height - TABLE_SCROLLBAR_HEIGHT - SCROLL_BAR_OFFSET,
      width: state.width,
    };
  }, [state.isHeaderVisible, state.height, state.compactMode, state.width]);

  const focusFirstEditableCellInNewRow = React.useCallback(() => {
    setTimeout(() => {
      const table = document.querySelector(
        `.tableWrap[data-widgetid="${state.widgetId}"]`,
      );

      if (!table) return;

      const firstEditableInput = table.querySelector(
        ".tableWrap .new-row .t--inlined-cell-editor input:not([disabled])",
      );

      if (firstEditableInput) (firstEditableInput as HTMLElement).focus();
    }, 0);
  }, [state.widgetId]);

  return (
    <TableContext.Provider
      value={{
        ...value,
        scrollContainerStyles,
        tableSizes,
        focusFirstEditableCellInNewRow,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useAppsmithTable = () => {
  const context = useContext(TableContext);

  if (context === undefined) {
    throw new Error("useTable must be used within a TableProvider");
  }

  return context;
};
