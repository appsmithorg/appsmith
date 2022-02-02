import React, { useCallback } from "react";
import { Datasource } from "entities/Datasource";
import { Plugin } from "api/PluginApi";
import DataSourceContextMenu from "./DataSourceContextMenu";
import { getPluginIcon } from "../ExplorerIcons";
import { getQueryIdFromURL } from "../helpers";
import Entity, { EntityClassNames } from "../Entity";
import { DATA_SOURCES_EDITOR_ID_URL } from "constants/routes";
import history from "utils/history";
import {
  fetchDatasourceStructure,
  saveDatasourceName,
  expandDatasourceEntity,
  setDatsourceEditorMode,
} from "actions/datasourceActions";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import { DatasourceStructureContainer } from "./DatasourceStructureContainer";
import { isStoredDatasource, PluginType } from "entities/Action";
import { SAAS_EDITOR_DATASOURCE_ID_URL } from "pages/Editor/SaaSEditor/constants";
import { getQueryParams } from "utils/AppsmithUtils";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import { getAction } from "selectors/entitiesSelector";

type ExplorerDatasourceEntityProps = {
  plugin: Plugin;
  datasource: Datasource;
  step: number;
  searchKeyword?: string;
  pageId: string;
  isActive: boolean;
};

const ExplorerDatasourceEntity = React.memo(
  (props: ExplorerDatasourceEntityProps) => {
    const applicationId = useSelector(getCurrentApplicationId);
    const pageId = useSelector(getCurrentPageId) as string;
    const dispatch = useDispatch();
    const icon = getPluginIcon(props.plugin);
    const switchDatasource = useCallback(() => {
      if (props.plugin && props.plugin.type === PluginType.SAAS) {
        history.push(
          SAAS_EDITOR_DATASOURCE_ID_URL(
            applicationId,
            pageId,
            props.plugin.packageName,
            props.datasource.id,
            {
              viewMode: true,
            },
          ),
        );
      } else {
        dispatch(
          setDatsourceEditorMode({ id: props.datasource.id, viewMode: true }),
        );
        history.push(
          DATA_SOURCES_EDITOR_ID_URL(
            applicationId,
            pageId,
            props.datasource.id,
            getQueryParams(),
          ),
        );
      }
    }, [applicationId, pageId, props.datasource.id]);

    const queryId = getQueryIdFromURL();
    const queryAction = useSelector((state: AppState) =>
      getAction(state, queryId || ""),
    );

    const updateDatasourceName = (id: string, name: string) =>
      saveDatasourceName({ id: props.datasource.id, name });

    const datasourceStructure = useSelector((state: AppState) => {
      return state.entities.datasources.structure[props.datasource.id];
    });

    const expandDatasourceId = useSelector((state: AppState) => {
      return state.ui.datasourcePane.expandDatasourceId;
    });

    const getDatasourceStructure = useCallback(
      (isOpen) => {
        if (!datasourceStructure && isOpen) {
          dispatch(fetchDatasourceStructure(props.datasource.id));
        }

        dispatch(expandDatasourceEntity(isOpen ? props.datasource.id : ""));
      },
      [datasourceStructure, props.datasource.id, dispatch],
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

    return (
      <Entity
        action={switchDatasource}
        active={props.isActive}
        className="datasource"
        contextMenu={
          <DataSourceContextMenu
            className={EntityClassNames.CONTEXT_MENU}
            datasourceId={props.datasource.id}
            entityId={`${props.datasource.id}-${props.pageId}`}
          />
        }
        entityId={`${props.datasource.id}-${props.pageId}`}
        icon={icon}
        isDefaultExpanded={isDefaultExpanded}
        key={props.datasource.id}
        name={props.datasource.name}
        onNameEdit={nameTransformFn}
        onToggle={getDatasourceStructure}
        searchKeyword={props.searchKeyword}
        step={props.step}
        updateEntityName={updateDatasourceName}
      >
        <DatasourceStructureContainer
          datasourceId={props.datasource.id}
          datasourceStructure={datasourceStructure}
          step={props.step}
        />
      </Entity>
    );
  },
);

ExplorerDatasourceEntity.displayName = "ExplorerDatasourceEntity";
export default ExplorerDatasourceEntity;
