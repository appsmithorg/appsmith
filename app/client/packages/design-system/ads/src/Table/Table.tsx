import React from "react";

import clsx from "classnames";
import RcTable from "rc-table";
import "rc-table/assets/index.css";
import type { DefaultRecordType } from "rc-table/lib/interface";

import { Flex } from "../Flex";
import { Icon } from "../Icon";
import { Text } from "../Text";
import { TableWrapperClassName } from "./Table.constants";
import {
  StyledBody,
  StyledCell,
  StyledHeader,
  StyledHeaderCell,
  StyledHeaderRow,
  StyledRow,
  StyledTable,
} from "./Table.styles";
import type { TableProps } from "./Table.types";
import "./reset.css";

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
