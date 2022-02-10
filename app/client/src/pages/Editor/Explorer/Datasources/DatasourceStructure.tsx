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
import { DatasourceTable } from "entities/Datasource";
import { Colors } from "constants/Colors";

const Wrapper = styled(EntityTogglesWrapper)`
  &&&& {
    svg,
    svg path {
      fill: #ff7235;
    }
  }
  span {
    font-size: ${(props) => props.theme.fontSizes[2]}px;
    margin-left: 5px;
  }
  padding: 0 5px;
  color: ${Colors.GRAY2};
`;

const StyledEntity = styled(Entity)`
  & > div {
    grid-template-columns: 20px auto 1fr auto auto;
  }
`;

type DatasourceStructureProps = {
  dbStructure: DatasourceTable;
  step: number;
  datasourceId: string;
};

export function DatasourceStructure(props: DatasourceStructureProps) {
  const dbStructure = props.dbStructure;
  const iconProps: IconProps = {
    width: 12,
    height: 12,
    color: "#FF7235",
  };
  let templateMenu = null;
  const [active, setActive] = useState(false);

  const lightningMenu = (
    <Wrapper
      className={`t--template-menu-trigger ${EntityClassNames.CONTEXT_MENU}`}
      onClick={() => setActive(!active)}
    >
      <IconWrapper {...iconProps}>
        <LightningIcon />
      </IconWrapper>
      <span>Add</span>
    </Wrapper>
  );

  if (dbStructure.templates) templateMenu = lightningMenu;
  const columnsAndKeys = dbStructure.columns.concat(dbStructure.keys);

  return (
    <Popover
      boundary={"viewport"}
      canEscapeKeyClose
      className={`t--structure-template-menu`}
      isOpen={active}
      minimal
      onInteraction={(nextOpenState: boolean) => {
        if (!nextOpenState) {
          setActive(false);
        }
      }}
      popoverClassName="t--structure-template-menu-popover"
      position={Position.RIGHT_TOP}
    >
      <StyledEntity
        action={() => setActive(!active)}
        active={active}
        className={`datasourceStructure`}
        contextMenu={templateMenu}
        entityId={"DatasourceStructure"}
        icon={datasourceTableIcon}
        name={dbStructure.name}
        step={props.step}
      >
        {columnsAndKeys.map((field, index) => {
          return (
            <DatasourceField
              field={field}
              key={`${field.name}${index}`}
              step={props.step + 1}
            />
          );
        })}
      </StyledEntity>
      <QueryTemplates
        datasourceId={props.datasourceId}
        templates={dbStructure.templates}
      />
    </Popover>
  );
}

export default DatasourceStructure;
