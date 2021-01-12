import {
  DatasourceStructure as DatasourceStructureType,
  DatasourceTable,
} from "entities/Datasource";
import React, { memo, ReactNode } from "react";
import EntityPlaceholder from "../Entity/Placeholder";
import { useEntityUpdateState } from "../hooks";
import DatasourceStructure from "./DatasourceStructure";

type Props = {
  datasourceId: string;
  datasourceStructure?: DatasourceStructureType;
  step: number;
};

export const DatasourceStructureContainer = memo((props: Props) => {
  const isLoading = useEntityUpdateState(props.datasourceId);
  let view: ReactNode = <div />;

  if (!isLoading) {
    if (
      props.datasourceStructure &&
      props.datasourceStructure.tables &&
      props.datasourceStructure.tables.length
    ) {
      view = props.datasourceStructure.tables.map(
        (structure: DatasourceTable) => {
          return (
            <DatasourceStructure
              key={`${props.datasourceId}${structure.name}`}
              dbStructure={structure}
              step={props.step + 1}
              datasourceId={props.datasourceId}
            />
          );
        },
      );
    } else {
      view = (
        <EntityPlaceholder step={props.step + 1}>
          No information available
        </EntityPlaceholder>
      );
    }
  }

  return <>{view}</>;
});

DatasourceStructureContainer.displayName = "DatasourceStructureContainer";
