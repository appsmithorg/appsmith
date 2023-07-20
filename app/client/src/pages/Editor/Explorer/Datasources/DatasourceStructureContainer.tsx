import {
  createMessage,
  DATASOURCE_STRUCTURE_INPUT_PLACEHOLDER_TEXT,
  SCHEMA_NOT_AVAILABLE,
  TABLE_OR_COLUMN_NOT_FOUND,
} from "@appsmith/constants/messages";
import type {
  DatasourceStructure as DatasourceStructureType,
  DatasourceTable,
} from "entities/Datasource";
import type { ReactElement } from "react";
import React, { memo, useEffect, useMemo, useState } from "react";
import EntityPlaceholder from "../Entity/Placeholder";
import DatasourceStructure from "./DatasourceStructure";
import { Input, Text } from "design-system";
import styled from "styled-components";
import { getIsFetchingDatasourceStructure } from "selectors/entitiesSelector";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import DatasourceStructureLoadingContainer from "./DatasourceStructureLoadingContainer";
import DatasourceStructureNotFound from "./DatasourceStructureNotFound";
import AnalyticsUtil from "utils/AnalyticsUtil";

type Props = {
  datasourceId: string;
  datasourceStructure?: DatasourceStructureType;
  step: number;
  context: DatasourceStructureContext;
  pluginName?: string;
  currentActionId?: string;
};

export enum DatasourceStructureContext {
  EXPLORER = "entity-explorer",
  QUERY_EDITOR = "query-editor",
  // this does not exist yet, but in case it does in the future.
  API_EDITOR = "api-editor",
}

const DatasourceStructureSearchContainer = styled.div`
  margin-bottom: 8px;
  position: sticky;
  top: 0;
  overflow: hidden;
  z-index: 10;
  background: white;
`;

const Container = (props: Props) => {
  const isLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, props.datasourceId),
  );
  let view: ReactElement<Props> | JSX.Element = <div />;

  const [datasourceStructure, setDatasourceStructure] = useState<
    DatasourceStructureType | undefined
  >(props.datasourceStructure);
  const [hasSearchedOccured, setHasSearchedOccured] = useState(false);

  useEffect(() => {
    if (datasourceStructure !== props.datasourceStructure) {
      setDatasourceStructure(props.datasourceStructure);
    }
  }, [props.datasourceStructure]);

  const flatStructure = useMemo(() => {
    if (!props.datasourceStructure?.tables?.length) return [];
    const list: string[] = [];

    props.datasourceStructure.tables.map((table) => {
      table.columns.forEach((column) => {
        list.push(`${table.name}~${column.name}`);
      });
    });

    return list;
  }, [props.datasourceStructure]);

  const handleOnChange = (value: string) => {
    if (!props.datasourceStructure?.tables?.length) return;

    if (value.length > 0) {
      !hasSearchedOccured && setHasSearchedOccured(true);
    } else {
      hasSearchedOccured && setHasSearchedOccured(false);
    }

    const tables = new Set();
    const columns = new Set();

    flatStructure.forEach((structure) => {
      const segments = structure.split("~");
      // if the value is present in the columns, add the column and its parent table.
      if (segments[1].toLowerCase().includes(value)) {
        tables.add(segments[0]);
        columns.add(segments[1]);
        return;
      }

      // if the value is present in the table but not in the columns, add the table
      if (segments[0].toLowerCase().includes(value)) {
        tables.add(segments[0]);
        return;
      }
    });

    const filteredDastasourceStructure = props.datasourceStructure.tables
      .map((structure) => ({
        ...structure,
        columns:
          // if the size of the columns set is 0, then simply default to the entire column
          columns.size === 0
            ? structure.columns
            : structure.columns.filter((column) => columns.has(column.name)),
        keys:
          columns.size === 0
            ? structure.keys
            : structure.keys.filter((key) => columns.has(key.name)),
      }))
      .filter((table) => tables.has(table.name));

    setDatasourceStructure({ tables: filteredDastasourceStructure });

    AnalyticsUtil.logEvent("DATASOURCE_SCHEMA_SEARCH", {
      datasourceId: props.datasourceId,
      pluginName: props.pluginName,
    });
  };

  if (!isLoading) {
    if (props.datasourceStructure?.tables?.length) {
      view = (
        <>
          {props.context !== DatasourceStructureContext.EXPLORER && (
            <DatasourceStructureSearchContainer>
              <Input
                className="datasourceStructure-search"
                onChange={(value) => handleOnChange(value)}
                placeholder={createMessage(
                  DATASOURCE_STRUCTURE_INPUT_PLACEHOLDER_TEXT,
                )}
                size={"md"}
                startIcon="search"
                type="text"
              />
            </DatasourceStructureSearchContainer>
          )}
          {!!datasourceStructure?.tables?.length &&
            datasourceStructure.tables.map((structure: DatasourceTable) => {
              return (
                <DatasourceStructure
                  context={props.context}
                  currentActionId={props.currentActionId || ""}
                  datasourceId={props.datasourceId}
                  dbStructure={structure}
                  forceExpand={hasSearchedOccured}
                  key={`${props.datasourceId}${structure.name}-${props.context}`}
                  step={props.step + 1}
                />
              );
            })}

          {!datasourceStructure?.tables?.length && (
            <Text kind="body-s" renderAs="p">
              {createMessage(TABLE_OR_COLUMN_NOT_FOUND)}
            </Text>
          )}
        </>
      );
    } else {
      if (props.context !== DatasourceStructureContext.EXPLORER) {
        view = (
          <DatasourceStructureNotFound
            datasourceId={props.datasourceId}
            error={
              !!props.datasourceStructure &&
              "error" in props.datasourceStructure
                ? props.datasourceStructure.error
                : { message: createMessage(SCHEMA_NOT_AVAILABLE) }
            }
            pluginName={props?.pluginName || ""}
          />
        );
      } else {
        view = (
          <EntityPlaceholder step={props.step + 1}>
            {props.datasourceStructure &&
            props.datasourceStructure.error &&
            props.datasourceStructure.error.message &&
            props.datasourceStructure.error.message !== "null"
              ? props.datasourceStructure.error.message
              : createMessage(SCHEMA_NOT_AVAILABLE)}
          </EntityPlaceholder>
        );
      }
    }
  } else if (
    // intentionally leaving this here in case we want to show loading states in the explorer or query editor page
    props.context !== DatasourceStructureContext.EXPLORER &&
    isLoading
  ) {
    view = <DatasourceStructureLoadingContainer />;
  }

  return view;
};

export const DatasourceStructureContainer = memo(Container);

DatasourceStructureContainer.displayName = "DatasourceStructureContainer";
