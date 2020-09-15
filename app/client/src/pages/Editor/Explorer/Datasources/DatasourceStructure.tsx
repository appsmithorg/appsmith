import React, { useState } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as LightningIcon } from "assets/icons/control/lightning.svg";
import { Popover, Position } from "@blueprintjs/core";
import Entity, { EntityClassNames } from "../Entity";
import { queryIcon } from "../ExplorerIcons";
import { EntityTogglesWrapper } from "../ExplorerStyledComponents";
import styled from "styled-components";
import QueryTemplates from "./QueryTemplates";
import DatabaseColumns from "./DatabaseColumns";
import { DatasourceTable } from "api/DatasourcesApi";

const Wrapper = styled(EntityTogglesWrapper)`
  &&&& {
    color: #ff7235;
    svg,
    svg path {
      fill: #ff7235;
    }
  }
`;

type DatasourceStructureProps = {
  dbStructure: DatasourceTable;
  step: number;
  datasourceId: string;
};

export const DatasourceStructure = (props: DatasourceStructureProps) => {
  const dbStructure = props.dbStructure;
  const iconProps: IconProps = {
    width: 12,
    height: 12,
    color: "#FF7235",
  };
  let templateMenu = null;
  const [active, setActive] = useState(false);

  const lightningMenu = (
    <Wrapper>
      <IconWrapper {...iconProps}>
        <LightningIcon />
      </IconWrapper>
    </Wrapper>
  );

  if (dbStructure.templates)
    templateMenu = (
      <Popover
        canEscapeKeyClose={true}
        onOpened={() => setActive(true)}
        onClosed={() => {
          setActive(false);
        }}
        className={`${EntityClassNames.CONTEXT_MENU}`}
        minimal
        position={Position.RIGHT_TOP}
        boundary={"viewport"}
      >
        {lightningMenu}
        <QueryTemplates
          datasourceId={props.datasourceId}
          templates={dbStructure.templates}
        />
      </Popover>
    );
  const columnsAndKeys = dbStructure.columns.concat(dbStructure.keys);

  return (
    <Entity
      entityId={"DatasourceStructure"}
      name={dbStructure.name}
      icon={queryIcon}
      step={props.step}
      active={active}
      contextMenu={templateMenu}
    >
      {columnsAndKeys.map((column: any, index: number) => {
        return (
          <DatabaseColumns
            key={`${column.name}${index}`}
            step={props.step + 1}
            column={column}
          />
        );
      })}
    </Entity>
  );
};

export default DatasourceStructure;
