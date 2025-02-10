import React, { useState } from "react";
import RcTable from "rc-table";
import clsx from "classnames";
import "rc-table/assets/index.css";
import "./reset.css";
import type { DataIndex } from "rc-table/es/interface";
import type { DefaultRecordType } from "rc-table/lib/interface";
import type { TableColumn, TableProps, TableSorter } from "./Table.types";
import {
  StyledBody,
  StyledCell,
  StyledHeader,
  StyledHeaderCell,
  StyledHeaderRow,
  StyledIcon,
  StyledRow,
  StyledTable,
  StyledTitle,
} from "./Table.styles";
import { TableWrapperClassName } from "./Table.constants";
import { Icon } from "../Icon";
import { Text } from "../Text";
import { Flex } from "../Flex";
import orderBy from "lodash/orderBy";

function Table<T extends DefaultRecordType = DefaultRecordType>({
  className,
  emptyText = NoData,
  ...props
}: TableProps<T>) {
  const { columns, data, isSortable = false } = props;

  const components = {
    table: StyledTable,
    header: {
      wrapper: StyledHeader,
      row: StyledHeaderRow,
      cell: StyledHeaderCell,
    },
    body: {
      wrapper: StyledBody,
      row: StyledRow,
      cell: StyledCell,
    },
  };

  const [sorter, setSorter] = useState<TableSorter>({
    field: undefined,
    order: undefined,
    path: undefined,
  });

  const handleSort = (field?: DataIndex, sortBy?: string) => {
    setSorter((prev) => {
      const isAsc = prev.field === field && prev.order === "asc";

      return {
        field,
        order: isAsc ? "desc" : "asc",
        path: sortBy ? `${field}.${sortBy}` : field,
      };
    });
  };

  const renderTitle = (col: TableColumn<T>) => {
    if (col.isSortable === false) return col.title;

    return (
      <StyledTitle>
        {col.title}
        <StyledIcon
          isVisible={sorter.field === col?.dataIndex}
          name={sorter.order === "asc" ? "down-arrow-2" : "arrow-up-line"}
          size="sm"
        />
      </StyledTitle>
    );
  };

  const getColumns = () => {
    if (!isSortable) return columns;

    return columns?.map((col: TableColumn<T>) => ({
      ...col,
      onHeaderCell: () => ({
        onClick: () => {
          if (col.isSortable === false) return;

          handleSort(col?.dataIndex, col?.sortBy);
        },
      }),
      title: renderTitle(col),
    }));
  };

  const getData = () => {
    if (!Array.isArray(data)) return;

    if (!isSortable || !sorter.field) return data;

    if (sorter.order === "asc") {
      return orderBy(data, sorter.path, "asc");
    }

    if (sorter.order === "desc") {
      return orderBy(data, sorter.path, "desc");
    }
  };

  return (
    <RcTable<T>
      {...props}
      className={clsx(TableWrapperClassName, className)}
      columns={getColumns()}
      components={components}
      data={getData()}
      emptyText={emptyText}
    />
  );
}

Table.displayName = "Table";

function NoData() {
  return (
    <Flex
      alignItems={"center"}
      flexDirection={"column"}
      gap={"spaces-2"}
      justifyContent={"center"}
    >
      <Icon name="search-line" size="lg" />
      <Text>No data found</Text>
    </Flex>
  );
}

export { Table };
