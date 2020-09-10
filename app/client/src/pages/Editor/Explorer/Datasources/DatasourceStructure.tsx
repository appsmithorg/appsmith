import React from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as LightningIcon } from "assets/icons/control/lightning.svg";
import { Popover, Position } from "@blueprintjs/core";
import Entity from "../Entity";
import { queryIcon } from "../ExplorerIcons";
import { EntityTogglesWrapper } from "../ExplorerStyledComponents";
import styled from "styled-components";
import QueryPreview from "./QueryPreview";
import DatabaseColumns from "./DatabaseColumns";

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
  dbStructure: any;
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

  const lightningMenu = (
    <Wrapper>
      <IconWrapper {...iconProps}>
        <LightningIcon />
      </IconWrapper>
    </Wrapper>
  );

  if (dbStructure.templates)
    templateMenu = (
      <Popover minimal position={Position.RIGHT_TOP} boundary={"viewport"}>
        {lightningMenu}
        <QueryPreview datasourceId={props.datasourceId} />
      </Popover>
    );

  return (
    <Entity
      entityId={"DatasourceStructure"}
      name={dbStructure.name}
      icon={queryIcon}
      step={props.step}
      contextMenu={templateMenu}
    >
      {dbStructure.columns.map((column: any) => {
        return (
          <DatabaseColumns
            key={column.name}
            step={props.step + 1}
            column={column}
          />
        );
      })}
    </Entity>
  );
};

export default DatasourceStructure;
