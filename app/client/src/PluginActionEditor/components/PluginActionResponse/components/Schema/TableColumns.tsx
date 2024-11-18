import React from "react";
import { Flex } from "@appsmith/ads";
import { find } from "lodash";

import type {
  DatasourceColumns,
  DatasourceKeys,
  DatasourceStructure,
} from "entities/Datasource";
import { StatusDisplay } from "./StatusDisplay";
import DatasourceField from "pages/Editor/DatasourceInfo/DatasourceField";

interface Props {
  isLoading: boolean;
  datasourceStructure: DatasourceStructure;
  selectedTable: string | undefined;
}

const TableColumns = ({
  datasourceStructure,
  isLoading,
  selectedTable,
}: Props) => {
  const columns =
    find(datasourceStructure?.tables, ["name", selectedTable])?.columns || [];

  const selectedTableItems = find(datasourceStructure?.tables, [
    "name",
    selectedTable,
  ]);

  const columnsAndKeys: Array<DatasourceColumns | DatasourceKeys> = [];

  if (selectedTableItems) {
    columnsAndKeys.push(...selectedTableItems.keys);
    columnsAndKeys.push(...selectedTableItems.columns);
  }

  return (
    <Flex
      borderLeft="1px solid var(--ads-v2-color-border)"
      flex="1"
      flexDirection="column"
      height={`100%`}
      justifyContent={
        isLoading || columns.length === 0 ? "center" : "flex-start"
      }
      overflowY="scroll"
      padding="spaces-3"
    >
      {isLoading ? <StatusDisplay state="LOADING" /> : null}
      {!isLoading && columns.length === 0 ? (
        <StatusDisplay state="NOCOLUMNS" />
      ) : null}
      {!isLoading &&
        columnsAndKeys.map((field, index) => {
          return (
            <DatasourceField
              field={field}
              key={`${field.name}${index}`}
              step={0}
            />
          );
        })}
    </Flex>
  );
};

export { TableColumns };
