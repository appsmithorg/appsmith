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
import { useCloseMenuOnScroll } from "../hooks";
import { SIDEBAR_ID } from "constants/Explorer";
import { hasCreateDatasourceActionPermission } from "@appsmith/utils/permissionHelpers";
import { useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import { getDatasource } from "selectors/entitiesSelector";
import { getPagePermissions } from "selectors/editorSelectors";

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
  useCloseMenuOnScroll(SIDEBAR_ID, active, () => setActive(false));

  const datasource = useSelector((state: AppState) =>
    getDatasource(state, props.datasourceId),
  );

  const datasourcePermissions = datasource?.userPermissions || [];
  const pagePermissions = useSelector(getPagePermissions);

  const canCreateDatasourceActions = hasCreateDatasourceActionPermission([
    ...datasourcePermissions,
    ...pagePermissions,
  ]);

  const lightningMenu = canCreateDatasourceActions ? (
    <Wrapper
      className={`t--template-menu-trigger ${EntityClassNames.CONTEXT_MENU}`}
      onClick={() => setActive(!active)}
    >
      <IconWrapper {...iconProps}>
        <LightningIcon />
      </IconWrapper>
      <span>Add</span>
    </Wrapper>
  ) : null;

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
        action={() => canCreateDatasourceActions && setActive(!active)}
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
