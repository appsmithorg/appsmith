import React, { useCallback } from "react";
import {
  useAppWideAndOtherDatasource,
  useDatasourceSuggestions,
} from "./hooks";
import { Datasource } from "entities/Datasource";
import ExplorerDatasourceEntity from "./Datasources/DatasourceEntity";
import { useSelector } from "react-redux";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getPlugins } from "selectors/entitiesSelector";
import { keyBy, noop } from "lodash";
import Entity from "./Entity";
import history from "utils/history";
import { INTEGRATION_TABS } from "constants/routes";
import {
  ADD_DATASOURCE_BUTTON,
  createMessage,
  CREATE_DATASOURCE_TOOLTIP,
  EMPTY_DATASOURCE_BUTTON_TEXT,
  EMPTY_DATASOURCE_MAIN_TEXT,
} from "@appsmith/constants/messages";
import styled from "styled-components";
import ArrowRightLineIcon from "remixicon-react/ArrowRightLineIcon";
import { Colors } from "constants/Colors";
import {
  useDatasourceIdFromURL,
  getExplorerStatus,
  saveExplorerStatus,
} from "./helpers";
import { Icon } from "design-system";
import { AddEntity, EmptyComponent } from "./common";
import { integrationEditorURL } from "RouteBuilder";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";

import { AppState } from "@appsmith/reducers";
import {
  hasCreateDatasourcePermission,
  hasManageDatasourcePermission,
} from "@appsmith/utils/permissionHelpers";

const ShowAll = styled.div`
  padding: 0.25rem 1.5rem;
  font-weight: 500;
  font-size: 12px;
  color: ${Colors.DOVE_GRAY2};
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  &:hover {
    transform: scale(1.01);
  }
`;

const Datasources = React.memo(() => {
  const { appWideDS, otherDS } = useAppWideAndOtherDatasource();
  const pageId = useSelector(getCurrentPageId) || "";
  const plugins = useSelector(getPlugins);
  const applicationId = useSelector(getCurrentApplicationId);
  const isDatasourcesOpen = getExplorerStatus(applicationId, "datasource");
  const pluginGroups = React.useMemo(() => keyBy(plugins, "id"), [plugins]);

  const userWorkspacePermissions = useSelector(
    (state: AppState) => getCurrentAppWorkspace(state).userPermissions ?? [],
  );

  const canCreateDatasource = hasCreateDatasourcePermission(
    userWorkspacePermissions,
  );

  const addDatasource = useCallback(() => {
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab: INTEGRATION_TABS.NEW,
      }),
    );
  }, [pageId]);
  const activeDatasourceId = useDatasourceIdFromURL();
  const datasourceSuggestions = useDatasourceSuggestions();

  const listDatasource = useCallback(() => {
    history.push(
      integrationEditorURL({
        pageId,
        selectedTab: INTEGRATION_TABS.ACTIVE,
      }),
    );
  }, [pageId]);

  const datasourceElements = React.useMemo(
    () =>
      appWideDS.concat(datasourceSuggestions).map((datasource: Datasource) => {
        const datasourcePermissions = datasource.userPermissions || [];

        const canManageDatasource = hasManageDatasourcePermission(
          datasourcePermissions,
        );
        return (
          <ExplorerDatasourceEntity
            canManageDatasource={canManageDatasource}
            datasource={datasource}
            isActive={datasource.id === activeDatasourceId}
            key={datasource.id}
            pageId={pageId}
            plugin={pluginGroups[datasource.pluginId]}
            searchKeyword={""}
            step={1}
          />
        );
      }),
    [appWideDS, pageId],
  );

  const onDatasourcesToggle = useCallback(
    (isOpen: boolean) => {
      saveExplorerStatus(applicationId, "datasource", isOpen);
    },
    [applicationId],
  );

  return (
    <Entity
      addButtonHelptext={createMessage(CREATE_DATASOURCE_TOOLTIP)}
      className={"datasources"}
      entityId="datasources_section"
      icon={null}
      isDefaultExpanded={
        isDatasourcesOpen === null || isDatasourcesOpen === undefined
          ? false
          : isDatasourcesOpen
      }
      isSticky
      name="Datasources"
      onCreate={addDatasource}
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
            addFunction: addDatasource || noop,
          })}
        />
      )}
      {datasourceElements.length > 0 && canCreateDatasource && (
        <AddEntity
          action={addDatasource}
          entityId="add_new_datasource"
          icon={<Icon name="plus" />}
          name={createMessage(ADD_DATASOURCE_BUTTON)}
          step={1}
        />
      )}
      {otherDS.length ? (
        <ShowAll onClick={listDatasource}>
          Show all datasources
          <ArrowRightLineIcon color={Colors.DOVE_GRAY2} size={"14px"} />
        </ShowAll>
      ) : null}
    </Entity>
  );
});

Datasources.displayName = "Datasources";

export default Datasources;
