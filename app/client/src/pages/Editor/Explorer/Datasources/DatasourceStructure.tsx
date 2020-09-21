import React, { useState } from "react";
import { IconProps, IconWrapper } from "constants/IconConstants";
import { ReactComponent as LightningIcon } from "assets/icons/control/lightning.svg";
import { Popover, Position } from "@blueprintjs/core";
import Entity, { EntityClassNames } from "../Entity";
import { datasourceTableIcon } from "../ExplorerIcons";
import { EntityTogglesWrapper } from "../ExplorerStyledComponents";
import styled from "styled-components";
import QueryTemplates from "./QueryTemplates";
import DatasourceField from "./DatasourceField";
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
    <Wrapper className="t--template-menu-trigger">
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
        className={`${EntityClassNames.CONTEXT_MENU} t--template-menu`}
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
      className={"datasourceStructure"}
      name={dbStructure.name}
      icon={datasourceTableIcon}
      step={props.step}
      active={active}
      contextMenu={templateMenu}
    >
      {columnsAndKeys.map((field, index) => {
        return (
          <DatasourceField
            key={`${field.name}${index}`}
            step={props.step + 1}
            field={field}
          />
        );
      })}
    </Entity>
  );
};

export default DatasourceStructure;
