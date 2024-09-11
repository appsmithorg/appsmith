import styled from "styled-components";
import clsx from "classnames";
import {
  TableBodyCellClassName,
  TableBodyClassName,
  TableBodyRowClassName,
  TableClassName,
  TableHeaderCellClassName,
  TableHeaderClassName,
  TableHeaderRowClassName,
} from "./Table.constants";

export const StyledTable = styled.table.attrs(({ className }) => ({
  className: clsx(TableClassName, className),
}))`
  border-collapse: collapse;
  border: none;
  border-color: unset;
`;

export const StyledHeader = styled.thead.attrs(({ className }) => ({
  className: clsx(TableHeaderClassName, className),
}))``;

export const StyledHeaderRow = styled.tr.attrs(({ className }) => ({
  className: clsx(TableHeaderRowClassName, className),
}))`
  height: var(--ads-v2-spaces-13);
`;

export const StyledHeaderCell = styled.th.attrs(({ className }) => ({
  className: clsx(TableHeaderCellClassName, className),
}))`
  && {
    font-size: var(--ads-v2-font-size-4);
    font-style: normal;
    font-weight: var(--ads-v2-font-weight-normal);
    line-height: 13px;
    color: var(--ads-v2-colors-content-label-default-fg);
    font-family: var(--ads-v2-font-family);
    border: none;
    border-color: unset;
    padding: var(--ads-v2-spaces-5);
    background-color: var(--ads-v2-colors-content-surface-neutral-bg);
    border-bottom: 1px solid var(--ads-v2-colors-content-surface-default-border);
    text-align: left;
  }
`;

export const StyledBody = styled.tbody.attrs(({ className }) => ({
  className: clsx(TableBodyClassName, className),
}))``;

export const StyledRow = styled.tr.attrs(({ className }) => ({
  className: clsx(TableBodyRowClassName, className),
}))`
  border-bottom: 1px solid var(--ads-v2-colors-content-surface-default-border);
`;

export const StyledCell = styled.td.attrs(({ className }) => ({
  className: clsx(TableBodyCellClassName, className),
}))`
  && {
    font-size: var(--ads-v2-font-size-4);
    padding: var(--ads-v2-spaces-6) var(--ads-v2-spaces-5);
    color: var(--ads-v2-colors-content-label-default-fg);
    font-family: var(--ads-v2-font-family);
    border: none;
    line-height: normal;
  }

  &&.rc-table-cell.rc-table-cell-row-hover {
    background: var(--ads-v2-colors-content-surface-neutral-bg);
  }
`;
