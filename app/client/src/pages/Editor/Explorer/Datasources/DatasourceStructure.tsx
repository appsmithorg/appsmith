import React, { useState, useContext } from "react";
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
import { getDatasource, getPlugin } from "selectors/entitiesSelector";
import { getPagePermissions } from "selectors/editorSelectors";
import { Menu, MenuTrigger, Button, Tooltip, MenuContent } from "design-system";
import { SHOW_TEMPLATES, createMessage } from "@appsmith/constants/messages";
import styled from "styled-components";
import { DatasourceStructureContext } from "./DatasourceStructureContainer";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { Plugin } from "api/PluginApi";
import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { setFeatureFlagShownStatus } from "utils/storage";
import { FEATURE_FLAG } from "@appsmith/entities/FeatureFlag";

type DatasourceStructureProps = {
  dbStructure: DatasourceTable;
  step: number;
  datasourceId: string;
  context: DatasourceStructureContext;
  isDefaultOpen?: boolean;
  forceExpand?: boolean;
  currentActionId: string;
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

  const { isOpened: isWalkthroughOpened, popFeature } =
    useContext(WalkthroughContext) || {};

  const datasource = useSelector((state: AppState) =>
    getDatasource(state, props.datasourceId),
  );

  const plugin: Plugin | undefined = useSelector((state) =>
    getPlugin(state, datasource?.pluginId || ""),
  );

  const datasourcePermissions = datasource?.userPermissions || [];
  const pagePermissions = useSelector(getPagePermissions);

  const canCreateDatasourceActions = hasCreateDatasourceActionPermission([
    ...datasourcePermissions,
    ...pagePermissions,
  ]);

  const onSelect = () => {
    setActive(false);
  };

  const onEntityClick = () => {
    AnalyticsUtil.logEvent("DATASOURCE_SCHEMA_TABLE_SELECT", {
      datasourceId: props.datasourceId,
      pluginName: plugin?.name,
    });

    canCreateDatasourceActions && setActive(!active);

    dbStructure.templates.length === 0 &&
      isWalkthroughOpened &&
      closeWalkthrough();
  };

  const closeWalkthrough = () => {
    popFeature && popFeature();
    setFeatureFlagShownStatus(FEATURE_FLAG.ab_ds_schema_enabled, true);
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

  if (dbStructure.templates) templateMenu = lightningMenu;
  const columnsAndKeys = dbStructure.columns.concat(dbStructure.keys);

  return (
    <Entity
      action={onEntityClick}
      active={active}
      className={`datasourceStructure${
        props.context !== DatasourceStructureContext.EXPLORER &&
        `-${props.context}`
      }`}
      contextMenu={templateMenu}
      entityId={`${props.datasourceId}-${dbStructure.name}-${props.context}`}
      forceExpand={props.forceExpand}
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
}

export default DatasourceStructure;
