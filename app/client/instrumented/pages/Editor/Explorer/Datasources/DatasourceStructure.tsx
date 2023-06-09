import React, { useState } from "react";
import Entity, { EntityClassNames } from "../Entity";
import { datasourceTableIcon } from "../ExplorerIcons";
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
import { Menu, MenuTrigger, Button, Tooltip, MenuContent } from "design-system";
import { SHOW_TEMPLATES, createMessage } from "@appsmith/constants/messages";
import styled from "styled-components";

type DatasourceStructureProps = {
  dbStructure: DatasourceTable;
  step: number;
  datasourceId: string;
};

const StyledMenuContent = styled(MenuContent)`
  min-width: 220px;
  max-height: 200px;
`;

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
    <Menu open={active}>
      <Tooltip
        content={createMessage(SHOW_TEMPLATES)}
        isDisabled={active}
        mouseLeaveDelay={0}
        placement="right"
      >
        <MenuTrigger>
          <Button
            className={`button-icon t--template-menu-trigger ${EntityClassNames.CONTEXT_MENU}`}
            isIconButton
            kind="tertiary"
            onClick={() => setActive(!active)}
            startIcon="increase-control-v2"
          />
        </MenuTrigger>
      </Tooltip>
      <StyledMenuContent
        align="start"
        className="t--structure-template-menu-popover"
        onInteractOutside={() => setActive(false)}
        side="right"
      >
        <QueryTemplates
          datasourceId={props.datasourceId}
          onSelect={() => setActive(false)}
          templates={dbStructure.templates}
        />
      </StyledMenuContent>
    </Menu>
  ) : null;

  if (dbStructure.templates) templateMenu = lightningMenu;
  const columnsAndKeys = dbStructure.columns.concat(dbStructure.keys);

  return (
    <Entity
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
    </Entity>
  );
}

export default DatasourceStructure;
