import React from "react";

import { DatasourceCreateEntryPoints } from "constants/Datasource";
import {
  ADD_DATASOURCE_BUTTON,
  CREATE_DATASOURCE_TOOLTIP,
  EMPTY_DATASOURCE_BUTTON_TEXT,
  EMPTY_DATASOURCE_MAIN_TEXT,
  createMessage,
} from "ee/constants/messages";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import { useDatasourceIdFromURL } from "ee/pages/Editor/Explorer/helpers";
import {
  useAppWideAndOtherDatasource,
  useDatasourceSuggestions,
} from "ee/pages/Editor/Explorer/hooks";
import type { AppState } from "ee/reducers";
import { getPlugins } from "ee/selectors/entitiesSelector";
import { getCurrentAppWorkspace } from "ee/selectors/selectedWorkspaceSelectors";
import {
  getHasCreateDatasourcePermission,
  getHasManageDatasourcePermission,
} from "ee/utils/BusinessFeatures/permissionPageHelpers";
import type { Datasource } from "entities/Datasource";
import { keyBy } from "lodash";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";

import { Button, Icon } from "@appsmith/ads";

import ExplorerDatasourceEntity from "../DatasourceInfo/DatasourceEntity";
import Entity from "./Entity";
import { AddEntity, EmptyComponent } from "./common";

interface DatasourcesProps {
  isDatasourcesOpen: boolean | null;
  addDatasource: (source: string) => void;
  onDatasourcesToggle: (isOpen: boolean) => void;
  listDatasource: () => void;
  entityId: string;
}

const ShowAllButton = styled(Button)`
  margin: 0.25rem 1.5rem;
`;

const Datasources = React.memo((props: DatasourcesProps) => {
  const { appWideDS, otherDS } = useAppWideAndOtherDatasource();
  const {
    addDatasource,
    isDatasourcesOpen,
    listDatasource,
    onDatasourcesToggle,
  } = props;
  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );
  const plugins = useSelector(getPlugins);
  const pluginGroups = React.useMemo(() => keyBy(plugins, "id"), [plugins]);
  const isFeatureEnabled = useFeatureFlag(FEATURE_FLAG.license_gac_enabled);

  const canCreateDatasource = getHasCreateDatasourcePermission(
    isFeatureEnabled,
    userWorkspacePermissions,
  );

  const activeDatasourceId = useDatasourceIdFromURL();
  const datasourceSuggestions = useDatasourceSuggestions();

  const datasourceElements = React.useMemo(
    () =>
      appWideDS.concat(datasourceSuggestions).map((datasource: Datasource) => {
        const datasourcePermissions = datasource.userPermissions || [];

        const canManageDatasource = getHasManageDatasourcePermission(
          isFeatureEnabled,
          datasourcePermissions,
        );
        return (
          <ExplorerDatasourceEntity
            canManageDatasource={canManageDatasource}
            datasource={datasource}
            entityId={props.entityId}
            isActive={datasource.id === activeDatasourceId}
            key={datasource.id}
            plugin={pluginGroups[datasource.pluginId]}
            searchKeyword={""}
            step={1}
          />
        );
      }),
    [appWideDS, props.entityId, activeDatasourceId],
  );

  return (
    <Entity
      addButtonHelptext={createMessage(CREATE_DATASOURCE_TOOLTIP)}
      className={"group datasources"}
      entityId={"datasources"}
      icon={null}
      isDefaultExpanded={
        isDatasourcesOpen === null || isDatasourcesOpen === undefined
          ? true
          : isDatasourcesOpen
      }
      isSticky
      name="Datasources"
      onCreate={() =>
        addDatasource(DatasourceCreateEntryPoints.ENTITY_EXPLORER_ADD_DS)
      }
      onToggle={onDatasourcesToggle}
      searchKeyword={""}
      showAddButton={canCreateDatasource}
      step={0}
    >
      {datasourceElements.length ? (
        datasourceElements
      ) : (
        <EmptyComponent
          mainText={createMessage(EMPTY_DATASOURCE_MAIN_TEXT)}
          {...(canCreateDatasource && {
            addBtnText: createMessage(EMPTY_DATASOURCE_BUTTON_TEXT),
            addFunction: () =>
              addDatasource(
                DatasourceCreateEntryPoints.ENTITY_EXPLORER_NEW_DATASOURCE,
              ),
          })}
        />
      )}
      {datasourceElements.length > 0 && canCreateDatasource && (
        <AddEntity
          action={() =>
            addDatasource(
              DatasourceCreateEntryPoints.ENTITY_EXPLORER_ADD_DS_CTA,
            )
          }
          entityId="add_new_datasource"
          icon={<Icon name="plus" />}
          name={createMessage(ADD_DATASOURCE_BUTTON)}
          step={1}
        />
      )}
      {otherDS.length ? (
        <ShowAllButton
          endIcon="arrow-right-line"
          kind="tertiary"
          onClick={listDatasource}
          size="sm"
        >
          Show all datasources
        </ShowAllButton>
      ) : null}
    </Entity>
  );
});

Datasources.displayName = "Datasources";

export default Datasources;
