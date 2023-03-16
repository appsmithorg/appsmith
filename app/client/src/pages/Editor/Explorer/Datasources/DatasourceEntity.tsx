import React, { useCallback } from "react";
import type { Datasource } from "entities/Datasource";
import type { Plugin } from "api/PluginApi";
import DataSourceContextMenu from "./DataSourceContextMenu";
import { getPluginIcon } from "../ExplorerIcons";
import { getQueryIdFromURL } from "@appsmith/pages/Editor/Explorer/helpers";
import Entity, { EntityClassNames } from "../Entity";
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
import { getAction } from "selectors/entitiesSelector";
import {
  datasourcesEditorIdURL,
  saasEditorDatasourceIdURL,
} from "RouteBuilder";
import { inGuidedTour } from "selectors/onboardingSelectors";
import { getCurrentPageId } from "selectors/editorSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useLocation } from "react-router";
import omit from "lodash/omit";
import { getQueryParams } from "utils/URLUtils";
import { debounce } from "lodash";

type ExplorerDatasourceEntityProps = {
  plugin: Plugin;
  datasource: Datasource;
  step: number;
  searchKeyword?: string;
  pageId: string;
  isActive: boolean;
  canManageDatasource?: boolean;
};

const ExplorerDatasourceEntity = React.memo(
  (props: ExplorerDatasourceEntityProps) => {
    const guidedTourEnabled = useSelector(inGuidedTour);
    const dispatch = useDispatch();
    const pageId = useSelector(getCurrentPageId);
    const icon = getPluginIcon(props.plugin);
    const location = useLocation();
    const switchDatasource = useCallback(() => {
      let url;
      if (props.plugin && props.plugin.type === PluginType.SAAS) {
        url = saasEditorDatasourceIdURL({
          pageId,
          pluginPackageName: props.plugin.packageName,
          datasourceId: props.datasource.id,
        });
      } else {
        url = datasourcesEditorIdURL({
          pageId,
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
    }, [props.datasource.id, props.datasource.name, location.pathname]);

    const queryId = getQueryIdFromURL();
    const queryAction = useSelector((state: AppState) =>
      getAction(state, queryId || ""),
    );

    const updateDatasourceNameCall = (id: string, name: string) =>
      updateDatasourceName({ id: props.datasource.id, name });

    const datasourceStructure = useSelector((state: AppState) => {
      return state.entities.datasources.structure[props.datasource.id];
    });

    const expandDatasourceId = useSelector((state: AppState) => {
      return state.ui.datasourcePane.expandDatasourceId;
    });

    //Debounce fetchDatasourceStructure request.
    const debounceFetchDatasourceRequest = debounce(async () => {
      dispatch(fetchDatasourceStructure(props.datasource.id, true));
    }, 300);

    const getDatasourceStructure = useCallback(
      (isOpen: boolean) => {
        if (!datasourceStructure && isOpen) {
          debounceFetchDatasourceRequest();
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
