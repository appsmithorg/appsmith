import React, { useState } from "react";
import Entity, { EntityClassNames } from "../Entity";
import { datasourceTableIcon } from "../ExplorerIcons";
import { EntityTogglesWrapper } from "../ExplorerStyledComponents";
import styled from "styled-components";
import QueryTemplates from "./QueryTemplates";
import DatasourceField from "./DatasourceField";
import type { DatasourceTable } from "entities/Datasource";
import { useCloseMenuOnScroll } from "../hooks";
import { SIDEBAR_ID } from "constants/Explorer";
import { hasCreateDatasourceActionPermission } from "@appsmith/utils/permissionHelpers";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getDatasource } from "selectors/entitiesSelector";
import { getPagePermissions } from "selectors/editorSelectors";
import { Menu, MenuTrigger, Button } from "design-system";

const Wrapper = styled(EntityTogglesWrapper)`
  &&&& {
    svg,
    svg path {
      fill: var(--ads-v2-color-bg-brand);
    }
  }
  .button-icon {
    height: 36px;
  }
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
    <Menu>
      <MenuTrigger onClick={() => setActive(!active)}>
        <Wrapper
          className={`t--template-menu-trigger ${EntityClassNames.CONTEXT_MENU}`}
        >
          <Button
            className="button-icon"
            kind="tertiary"
            size="sm"
            startIcon="lightning"
          >
            Add
          </Button>
        </Wrapper>
      </MenuTrigger>
      <QueryTemplates
        datasourceId={props.datasourceId}
        templates={dbStructure.templates}
      />
    </Menu>
  ) : null;

  if (dbStructure.templates) templateMenu = lightningMenu;
  const columnsAndKeys = dbStructure.columns.concat(dbStructure.keys);

  return (
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
  );
}

export default DatasourceStructure;
