import React from "react";
import RcTable from "rc-table";
import clsx from "classnames";

import "rc-table/assets/index.css";
import "./reset.css";

import type { DefaultRecordType } from "rc-table/lib/interface";
import type { TableProps } from "./Table.types";
import {
  StyledBody,
  StyledCell,
  StyledHeader,
  StyledHeaderCell,
  StyledHeaderRow,
  StyledRow,
  StyledTable,
} from "./Table.styles";
import { TableWrapperClassName } from "./Table.constants";
import { Icon } from "../Icon";
import { Text } from "../Text";
import { Flex } from "../Flex";

function Table<T extends DefaultRecordType = DefaultRecordType>({
  className,
  emptyText = NoData,
  ...props
}: TableProps<T>) {
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
  return (
    <RcTable<T>
      {...props}
      className={clsx(TableWrapperClassName, className)}
      components={components}
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
