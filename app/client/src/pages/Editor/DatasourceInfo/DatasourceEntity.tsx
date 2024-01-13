import React, { useCallback } from "react";
import type { Datasource } from "entities/Datasource";
import { DatasourceStructureContext } from "entities/Datasource";
import type { Plugin } from "api/PluginApi";
import DataSourceContextMenu from "../Explorer/Datasources/DataSourceContextMenu";
import { getPluginIcon } from "../Explorer/ExplorerIcons";
import { getQueryIdFromURL } from "@appsmith/pages/Editor/Explorer/helpers";
import Entity, { EntityClassNames } from "../Explorer/Entity";
import history, { NavigationMethod } from "utils/history";
import {
  expandDatasourceEntity,
  fetchDatasourceStructure,
  updateDatasourceName,
} from "actions/datasourceActions";
import { useDispatch, useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { DatasourceStructureContainer } from "./DatasourceStructureContainer";
import { isStoredDatasource, PluginType } from "entities/Action";
import {
  getAction,
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
} from "@appsmith/selectors/entitiesSelector";
import {
  datasourcesEditorIdURL,
  saasEditorDatasourceIdURL,
} from "@appsmith/RouteBuilder";
import { inGuidedTour } from "selectors/onboardingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useLocation } from "react-router";
import omit from "lodash/omit";
import { getQueryParams } from "utils/URLUtils";
import { debounce } from "lodash";
import styled from "styled-components";

interface ExplorerDatasourceEntityProps {
  plugin: Plugin;
  datasource: Datasource;
  step: number;
  searchKeyword?: string;
  entityId: string;
  isActive: boolean;
  canManageDatasource?: boolean;
}

const MAX_HEIGHT_LIST_WRAPPER = 300;

const DataStructureListWrapper = styled.div<{ height: number }>`
  overflow-y: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: ${MAX_HEIGHT_LIST_WRAPPER}px;
  ${(props) => `min-height: ${props.height}px;`}
`;

const ExplorerDatasourceEntity = React.memo(
  (props: ExplorerDatasourceEntityProps) => {
    const { entityId } = props;
    const guidedTourEnabled = useSelector(inGuidedTour);
    const dispatch = useDispatch();
    const icon = getPluginIcon(props.plugin);
    const location = useLocation();
    const switchDatasource = useCallback(() => {
      let url;
      if (props.plugin && props.plugin.type === PluginType.SAAS) {
        url = saasEditorDatasourceIdURL({
          pageId: entityId,
          pluginPackageName: props.plugin.packageName,
          datasourceId: props.datasource.id,
          params: {
            viewMode: true,
          },
        });
      } else {
        url = datasourcesEditorIdURL({
          pageId: entityId,
          datasourceId: props.datasource.id,
          params: omit(getQueryParams(), "viewMode"),
        });
      }

      AnalyticsUtil.logEvent("ENTITY_EXPLORER_CLICK", {
        type: "DATASOURCES",
        fromUrl: location.pathname,
        toUrl: url,
        name: props.datasource.name,
      });
      history.push(url, { invokedBy: NavigationMethod.EntityExplorer });
    }, [
      props.datasource.id,
      props.datasource.name,
      location.pathname,
      entityId,
    ]);

    const queryId = getQueryIdFromURL();
    const queryAction = useSelector((state: AppState) =>
      getAction(state, queryId || ""),
    );

    const updateDatasourceNameCall = (id: string, name: string) =>
      updateDatasourceName({ id: props.datasource.id, name });

    const datasourceStructure = useSelector((state: AppState) =>
      getDatasourceStructureById(state, props.datasource.id),
    );

    const isFetchingDatasourceStructure = useSelector((state: AppState) =>
      getIsFetchingDatasourceStructure(state, props.datasource.id),
    );

    const expandDatasourceId = useSelector((state: AppState) => {
      return state.ui.datasourcePane.expandDatasourceId;
    });

    //Debounce fetchDatasourceStructure request.
    const debounceFetchDatasourceRequest = debounce(async () => {
      dispatch(
        fetchDatasourceStructure(
          props.datasource.id,
          true,
          DatasourceStructureContext.EXPLORER,
        ),
      );
    }, 300);

    const getDatasourceStructure = useCallback(
      (isOpen: boolean) => {
        if (!datasourceStructure && !isFetchingDatasourceStructure && isOpen) {
          debounceFetchDatasourceRequest();
        }

        dispatch(expandDatasourceEntity(isOpen ? props.datasource.id : ""));
      },
      [
        datasourceStructure,
        props.datasource.id,
        dispatch,
        isFetchingDatasourceStructure,
      ],
    );

    const nameTransformFn = useCallback(
      (input: string) => input.slice(0, 30),
      [],
    );

    let isDefaultExpanded = false;
    if (expandDatasourceId === props.datasource.id) {
      isDefaultExpanded = true;
    } else if (queryAction && isStoredDatasource(queryAction.datasource)) {
      isDefaultExpanded = queryAction.datasource.id === props.datasource.id;
    }
    // In guided tour we want the datasource structure to be shown only when expanded
    if (guidedTourEnabled) {
      isDefaultExpanded = false;
    }

    return (
      <Entity
        action={switchDatasource}
        active={props.isActive}
        canEditEntityName={props.canManageDatasource}
        className="datasource"
        contextMenu={
          <DataSourceContextMenu
            className={EntityClassNames.CONTEXT_MENU}
            datasourceId={props.datasource.id}
            entityId={`${props.datasource.id}`}
          />
        }
        entityId={`${props.datasource.id}`}
        icon={icon}
        isDefaultExpanded={isDefaultExpanded}
        key={props.datasource.id}
        name={props.datasource.name}
        onNameEdit={nameTransformFn}
        onToggle={getDatasourceStructure}
        searchKeyword={props.searchKeyword}
        step={props.step}
        updateEntityName={updateDatasourceNameCall}
      >
        <DataStructureListWrapper
          height={Math.min(
            (datasourceStructure?.tables?.length || 0) * 50,
            MAX_HEIGHT_LIST_WRAPPER,
          )}
        >
          <DatasourceStructureContainer
            context={DatasourceStructureContext.EXPLORER}
            datasourceId={props.datasource.id}
            datasourceStructure={datasourceStructure}
            step={props.step}
          />
        </DataStructureListWrapper>
      </Entity>
    );
  },
);

ExplorerDatasourceEntity.displayName = "ExplorerDatasourceEntity";
export default ExplorerDatasourceEntity;
