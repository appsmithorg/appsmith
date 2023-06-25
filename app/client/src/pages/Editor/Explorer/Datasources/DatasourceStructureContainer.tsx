import {
  createMessage,
  SCHEMA_NOT_AVAILABLE,
} from "@appsmith/constants/messages";
import type {
  DatasourceStructure as DatasourceStructureType,
  DatasourceTable,
} from "entities/Datasource";
import type { ReactElement } from "react";
import React, { memo, useEffect, useMemo, useState } from "react";
import EntityPlaceholder from "../Entity/Placeholder";
import DatasourceStructure from "./DatasourceStructure";
import { Input, Spinner, Text } from "design-system";
import styled from "styled-components";
import { getIsFetchingDatasourceStructure } from "selectors/entitiesSelector";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";

type Props = {
  datasourceId: string;
  datasourceStructure?: DatasourceStructureType;
  step: number;
  context: DatasourceStructureContext;
};

export enum DatasourceStructureContext {
  EXPLORER = "EntityExplorer",
  DATASOURCE = "Datasource",
  ACTION_EDITOR = "Action Editor",
}

const DatasourceStructureSearchContainer = styled.div`
  margin-bottom: 1rem;
`;

const DatasourceStructureLoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  & > p {
    margin-top: 0.5rem;
  }
`;

const Container = (props: Props) => {
  // const isLoading = useEntityUpdateState(props.datasourceId);
  const isLoading = useSelector((state: AppState) =>
    getIsFetchingDatasourceStructure(state, props.datasourceId),
  );
  let view: ReactElement<Props> = <div />;

  const [datasourceStructure, setDatasourceStructure] = useState(
    props.datasourceStructure,
  );

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

    const tables = new Set();
    const columns = new Set();
    const filteredStructure = flatStructure.filter((item) =>
      item.includes(value),
    );

    filteredStructure.forEach((structure) => {
      const segments = structure.split("~");
      tables.add(segments[0]);
      columns.add(segments[1]);
    });

    const filteredDastasourceStructure = props.datasourceStructure.tables
      .map((structure) => ({
        ...structure,
        columns: structure.columns.filter((column) => columns.has(column.name)),
      }))
      .filter((table) => tables.has(table.name));

    // console.log(
    //   "hereee filter",
    //   value,
    //   filteredStructure,
    //   tables,
    //   columns,
    //   filteredDastasourceStructure,
    // );

    setDatasourceStructure({ tables: filteredDastasourceStructure });
  };

  // console.log("hereeee final", datasourceStructure, flatStructure);

  if (!isLoading) {
    if (props.datasourceStructure?.tables?.length) {
      view = (
        <>
          {props.context !== DatasourceStructureContext.EXPLORER && (
            <DatasourceStructureSearchContainer>
              <Input
                onChange={(value) => handleOnChange(value)}
                placeholder="Search for table or attribute"
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
                  datasourceId={props.datasourceId}
                  dbStructure={structure}
                  key={`${props.datasourceId}${structure.name}`}
                  step={props.step + 1}
                />
              );
            })}
        </>
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
  } else if (
    props.context !== DatasourceStructureContext.EXPLORER &&
    isLoading
  ) {
    view = (
      <DatasourceStructureLoadingContainer>
        <Spinner size={"sm"} />
        <Text kind="body-s" renderAs="p">
          {" "}
          Loading schema...
        </Text>
      </DatasourceStructureLoadingContainer>
    );
  }

  return view;
};

export const DatasourceStructureContainer = memo(Container);

DatasourceStructureContainer.displayName = "DatasourceStructureContainer";
