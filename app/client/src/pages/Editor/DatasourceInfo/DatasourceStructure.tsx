import React, { memo, useMemo, useState } from "react";
import { EntityClassNames } from "../Explorer/Entity";
import { datasourceTableIcon } from "../Explorer/ExplorerIcons";
import QueryTemplates from "./QueryTemplates";
import type { DatasourceTable } from "entities/Datasource";
import type { DatasourceStructureContext } from "entities/Datasource";
import { useCloseMenuOnScroll } from "ee/pages/Editor/Explorer/hooks";
import { SIDEBAR_ID } from "constants/Explorer";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { getDatasource, getPlugin } from "ee/selectors/entitiesSelector";
import { getPagePermissions } from "selectors/editorSelectors";
import {
  Menu,
  MenuTrigger,
  Button,
  Tooltip,
  MenuContent,
  List,
  ListItem,
} from "@appsmith/ads";
import { SHOW_TEMPLATES, createMessage } from "ee/constants/messages";
import styled from "styled-components";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { Plugin } from "entities/Plugin";
import { omit } from "lodash";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { hasCreateDSActionPermissionInApp } from "ee/utils/BusinessFeatures/permissionPageHelpers";
import history from "utils/history";
import { getIDETypeByUrl } from "ee/entities/IDE/utils";

interface DatasourceStructureItemProps {
  dbStructure: DatasourceTable;
  step: number;
  datasourceId: string;
  context: DatasourceStructureContext;
  isDefaultOpen?: boolean;
  currentActionId: string;
  onEntityTableClick?: (table: string) => void;
  tableName?: string;
  showTemplates: boolean;
}

const StyledMenuContent = styled(MenuContent)`
  min-width: 220px;
  max-height: 200px;
`;

const StructureWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
`;

const StyledList = styled(List)`
  padding: 0;
`;

const DatasourceStructureItem = memo((props: DatasourceStructureItemProps) => {
  const dbStructure = props.dbStructure;
  let templateMenu = null;
  const [active, setActive] = useState(false);

  useCloseMenuOnScroll(SIDEBAR_ID, active, () => setActive(false));

  const datasource = useSelector((state: AppState) =>
    getDatasource(state, props.datasourceId),
  );

  const plugin: Plugin | undefined = useSelector((state) =>
    getPlugin(state, datasource?.pluginId || ""),
  );

  const datasourcePermissions = datasource?.userPermissions || [];
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);
  const ideType = getIDETypeByUrl(history.location.pathname);

  const canCreateDatasourceActions = hasCreateDSActionPermissionInApp({
    isEnabled: isFeatureEnabled,
    dsPermissions: datasourcePermissions,
    pagePermissions,
    ideType,
  });

  const onSelect = () => {
    setActive(false);
  };

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onEntityClick = (entity: any) => {
    AnalyticsUtil.logEvent("DATASOURCE_SCHEMA_TABLE_SELECT", {
      datasourceId: props.datasourceId,
      pluginName: plugin?.name,
    });

    if (!!props?.onEntityTableClick) {
      props?.onEntityTableClick(entity.target.outerText);
    }
  };

  const lightningMenu =
    canCreateDatasourceActions && dbStructure.templates.length > 0 ? (
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
              startIcon={"add-line"}
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
            context={props.context}
            currentActionId={props.currentActionId}
            datasourceId={props.datasourceId}
            onSelect={onSelect}
            templates={dbStructure.templates}
          />
        </StyledMenuContent>
      </Menu>
    ) : null;

  if (dbStructure.templates && props.showTemplates) {
    templateMenu = lightningMenu;
  }

  const activeState = useMemo(() => {
    return props.tableName === dbStructure.name || active;
  }, [active, props.tableName]);

  return (
    <ListItem
      className={`datasourceStructure-${props.context} t--entity-item`}
      dataTestId={`t--entity-item-${dbStructure.name}`}
      isSelected={activeState}
      onClick={onEntityClick}
      rightControl={templateMenu}
      startIcon={datasourceTableIcon}
      title={dbStructure.name}
    />
  );
});

type DatasourceStructureProps = Partial<DatasourceStructureItemProps> & {
  tables: Array<DatasourceTable>;
  step: number;
  datasourceId: string;
  context: DatasourceStructureContext;
  isDefaultOpen?: boolean;
  currentActionId: string;
  showTemplates: boolean;
};

const DatasourceStructure = (props: DatasourceStructureProps) => {
  return (
    <StructureWrapper>
      <StyledList className="t--schema-virtuoso-container">
        {props.tables.map((dbStructure) => (
          <DatasourceStructureItem
            {...omit(props, ["tables"])}
            dbStructure={dbStructure}
            key={`${props.datasourceId}${dbStructure.name}-${props.context}`}
            showTemplates={props.showTemplates}
          />
        ))}
      </StyledList>
    </StructureWrapper>
  );
};

export default DatasourceStructure;
