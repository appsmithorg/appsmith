import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Flex, type FlexProps, SearchInput, Text } from "@appsmith/ads";
import { find } from "lodash";

import type { DatasourceStructure } from "entities/Datasource";
import { StatusDisplay, SchemaDisplayStatus } from "./StatusDisplay";
import DatasourceField from "pages/Editor/DatasourceInfo/DatasourceField";
import {
  COLUMNS_SEARCH_PLACEHOLDER,
  COLUMNS_TITLE,
  createMessage,
} from "ee/constants/messages";
import Fuse from "fuse.js";
import { TableColumn } from "./styles";

interface Props {
  isLoading: boolean;
  datasourceStructure: DatasourceStructure;
  selectedTable: string | undefined;
}

const Wrapper: React.FC<FlexProps> = (props) => {
  return (
    <Flex
      borderLeft="1px solid var(--ads-v2-color-border)"
      flex="1"
      flexDirection="column"
      height="100%"
      justifyContent="flex-start"
      padding="spaces-3"
      {...props}
    >
      {props.children}
    </Flex>
  );
};

const TableColumns: React.FC<Props> = ({
  datasourceStructure,
  isLoading,
  selectedTable,
}) => {
  // Find selected table items
  const selectedTableItems = useMemo(
    () =>
      find(datasourceStructure?.tables, { name: selectedTable }) ?? {
        columns: [],
        keys: [],
      },
    [datasourceStructure, selectedTable],
  );

  // Combine columns and keys
  const columns = useMemo(() => {
    return selectedTableItems.columns.map((column) => ({
      name: column.name,
      type: column.type,
      keys: selectedTableItems.keys
        .filter(
          (key) =>
            key.columnNames?.includes(column.name) ||
            key.fromColumns?.includes(column.name),
        )
        .map((key) => key.type),
    }));
  }, [selectedTableItems]);

  // search
  const columnsFuzy = useMemo(
    () =>
      new Fuse(columns, {
        keys: ["name"],
        shouldSort: true,
        threshold: 0.5,
        location: 0,
      }),
    [columns],
  );

  const [term, setTerm] = useState("");
  const filteredColumns = useMemo(
    () => (term ? columnsFuzy.search(term) : columns),
    [term, columns, columnsFuzy],
  );

  const handleSearch = useCallback((value: string) => setTerm(value), []);

  // Reset term whenever selectedTable changes
  useEffect(
    function clearTerm() {
      setTerm("");
    },
    [selectedTable],
  );

  // loading status
  if (isLoading) {
    return (
      <Wrapper>
        <StatusDisplay state={SchemaDisplayStatus.LOADING} />
      </Wrapper>
    );
  }

  // no columns status
  if (columns.length === 0) {
    return (
      <Wrapper>
        <StatusDisplay state={SchemaDisplayStatus.NOCOLUMNS} />
      </Wrapper>
    );
  }

  return (
    <Wrapper gap="spaces-3">
      <Flex alignItems="center" minH="24px">
        <Text>{createMessage(COLUMNS_TITLE)}</Text>
      </Flex>
      <Flex>
        <SearchInput
          className="datasourceStructure-search"
          endIcon="close"
          onChange={handleSearch}
          placeholder={createMessage(COLUMNS_SEARCH_PLACEHOLDER, selectedTable)}
          size={"sm"}
          startIcon="search"
          value={term}
        />
      </Flex>
      <TableColumn flexDirection="column" overflowY="scroll">
        {filteredColumns.map((field, index) => (
          <DatasourceField
            field={field}
            key={`${field.name}${index}`}
            step={0}
          />
        ))}
      </TableColumn>
    </Wrapper>
  );
};

export { TableColumns };
