import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import Entity, { EntityClassNames } from "../Explorer/Entity";
import { datasourceTableIcon } from "../Explorer/ExplorerIcons";
import QueryTemplates from "./QueryTemplates";
import DatasourceField from "./DatasourceField";
import type { DatasourceTable } from "entities/Datasource";
import { DatasourceStructureContext } from "entities/Datasource";
import { useCloseMenuOnScroll } from "@appsmith/pages/Editor/Explorer/hooks";
import { SIDEBAR_ID } from "constants/Explorer";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { getDatasource, getPlugin } from "@appsmith/selectors/entitiesSelector";
import { getPagePermissions } from "selectors/editorSelectors";
import { Menu, MenuTrigger, Button, Tooltip, MenuContent } from "design-system";
import { SHOW_TEMPLATES, createMessage } from "@appsmith/constants/messages";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { Plugin } from "api/PluginApi";
import { omit } from "lodash";
import { Virtuoso } from "react-virtuoso";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";
import { hasCreateDSActionPermissionInApp } from "@appsmith/utils/BusinessFeatures/permissionPageHelpers";

interface DatasourceStructureItemProps {
  dbStructure: DatasourceTable;
  step: number;
  datasourceId: string;
  context: DatasourceStructureContext;
  isDefaultOpen?: boolean;
  currentActionId: string;
  onEntityTableClick?: (table: string) => void;
  tableName?: string;
}

const StyledMenuContent = styled(MenuContent)`
  min-width: 220px;
  max-height: 200px;
`;

const StructureWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const DatasourceStructureItem = memo((props: DatasourceStructureItemProps) => {
  const dbStructure = props.dbStructure;
  let templateMenu = null;
  const [active, setActive] = useState(false);
  useCloseMenuOnScroll(SIDEBAR_ID, active, () => setActive(false));
  const collapseRef = useRef<HTMLDivElement | null>(null);

  const datasource = useSelector((state: AppState) =>
    getDatasource(state, props.datasourceId),
  );

  const plugin: Plugin | undefined = useSelector((state) =>
    getPlugin(state, datasource?.pluginId || ""),
  );

  const datasourcePermissions = datasource?.userPermissions || [];
  const pagePermissions = useSelector(getPagePermissions);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateDatasourceActions = hasCreateDSActionPermissionInApp(
    isFeatureEnabled,
    datasourcePermissions,
    pagePermissions,
  );

  const onSelect = () => {
    setActive(false);
  };

  const onEntityClick = (entity: any) => {
    AnalyticsUtil.logEvent("DATASOURCE_SCHEMA_TABLE_SELECT", {
      datasourceId: props.datasourceId,
      pluginName: plugin?.name,
    });

    canCreateDatasourceActions && setActive(!active);

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
              startIcon={
                props.context !== DatasourceStructureContext.EXPLORER
                  ? "add-line"
                  : "increase-control-v2"
              }
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

  if (dbStructure.templates && !props?.onEntityTableClick)
    templateMenu = lightningMenu;
  const columnsAndKeys = dbStructure.columns.concat(dbStructure.keys);

  const activeState = useMemo(() => {
    if (props.context === DatasourceStructureContext.DATASOURCE_VIEW_MODE) {
      return props.tableName === dbStructure.name;
    } else {
      return active;
    }
  }, [active, props.tableName]);

  return (
    <Entity
      action={onEntityClick}
      active={activeState}
      className={`datasourceStructure${
        props.context !== DatasourceStructureContext.EXPLORER &&
        `-${props.context}`
      }`}
      collapseRef={collapseRef}
      contextMenu={templateMenu}
      entityId={`${props.datasourceId}-${dbStructure.name}-${props.context}`}
      icon={datasourceTableIcon}
      isDefaultExpanded={props?.isDefaultOpen}
      name={dbStructure.name}
      step={props.step}
    >
      <>
        {columnsAndKeys.map((field, index) => {
          return (
            <DatasourceField
              field={field}
              key={`${field.name}${index}`}
              step={props.step + 1}
            />
          );
        })}
      </>
    </Entity>
  );
});

type DatasourceStructureProps = Partial<DatasourceStructureItemProps> & {
  tables: Array<DatasourceTable>;
  step: number;
  datasourceId: string;
  context: DatasourceStructureContext;
  isDefaultOpen?: boolean;
  currentActionId: string;
};

const DatasourceStructure = (props: DatasourceStructureProps) => {
  const [containerHeight, setContainerHeight] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current?.offsetHeight) {
      setContainerHeight(containerRef.current?.offsetHeight);
    }
  }, []);

  const Row = (index: number) => {
    const structure = props.tables[index];

    return (
      <DatasourceStructureItem
        {...omit(props, ["tables"])}
        dbStructure={structure}
        key={`${props.datasourceId}${structure.name}-${props.context}`}
      />
    );
  };

  return (
    <StructureWrapper ref={containerRef}>
      {containerHeight && (
        <Virtuoso
          className="t--schema-virtuoso-container"
          itemContent={Row}
          style={{ height: `${containerHeight}px` }}
          totalCount={props.tables.length}
        />
      )}
    </StructureWrapper>
  );
};

export default DatasourceStructure;
