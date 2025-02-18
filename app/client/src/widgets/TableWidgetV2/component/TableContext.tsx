import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { TableProps } from "./types";

export interface TableProviderProps extends TableProps {
  children: ReactNode;
  currentPageIndex: number;
  pageCount: number;
  pageOptions: number[];
}

export interface TableContextState
  extends Omit<TableProviderProps, "children"> {}

export const TableContext = createContext<TableContextState | undefined>(
  undefined,
);

export const TableProvider = ({ children, ...state }: TableProviderProps) => {
  const value = useMemo(() => state, [state]);

  return (
    <TableContext.Provider value={value}>{children}</TableContext.Provider>
  );
};

export const useAppsmithTable = () => {
  const context = useContext(TableContext);

  if (context === undefined) {
    throw new Error("useTable must be used within a TableProvider");
  }

  return context;
};
