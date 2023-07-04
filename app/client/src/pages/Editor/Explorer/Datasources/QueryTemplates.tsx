import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createActionRequest } from "actions/pluginActionActions";
import type { AppState } from "@appsmith/reducers";
import { createNewQueryName } from "utils/AppsmithUtils";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import type { QueryAction } from "entities/Action";
import history from "utils/history";
import type { Datasource, QueryTemplate } from "entities/Datasource";
import { INTEGRATION_TABS } from "constants/routes";
import { getDatasource, getPlugin } from "selectors/entitiesSelector";
import { integrationEditorURL } from "RouteBuilder";
import { MenuItem } from "design-system";
import type { Plugin } from "api/PluginApi";
import { DatasourceStructureContext } from "./DatasourceStructureContainer";

type QueryTemplatesProps = {
  templates: QueryTemplate[];
  datasourceId: string;
  onSelect: () => void;
  context: DatasourceStructureContext;
};

enum QueryTemplatesEvent {
  EXPLORER_TEMPLATE = "explorer-template",
  QUERY_EDITOR_TEMPLATE = "query-editor-template",
}

export function QueryTemplates(props: QueryTemplatesProps) {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);
  const dataSource: Datasource | undefined = useSelector((state: AppState) =>
    getDatasource(state, props.datasourceId),
  );
  const plugin: Plugin | undefined = useSelector((state: AppState) =>
    getPlugin(state, !!dataSource?.pluginId ? dataSource.pluginId : ""),
  );
  const createQueryAction = useCallback(
    (template: QueryTemplate) => {
      const newQueryName = createNewQueryName(actions, currentPageId || "");
      const queryactionConfiguration: Partial<QueryAction> = {
        actionConfiguration: {
          body: template.body,
          pluginSpecifiedTemplates: template.pluginSpecifiedTemplates,
          formData: template.configuration,
          ...template.actionConfiguration,
        },
      };

      dispatch(
        createActionRequest({
          name: newQueryName,
          pageId: currentPageId,
          pluginId: dataSource?.pluginId,
          datasource: {
            id: props.datasourceId,
          },
          eventData: {
            actionType: "Query",
            from:
              props?.context === DatasourceStructureContext.EXPLORER
                ? QueryTemplatesEvent.EXPLORER_TEMPLATE
                : QueryTemplatesEvent.QUERY_EDITOR_TEMPLATE,
            dataSource: dataSource?.name,
            datasourceId: props.datasourceId,
            pluginName: plugin?.name,
          },
          ...queryactionConfiguration,
        }),
      );
      history.push(
        integrationEditorURL({
          pageId: currentPageId,
          selectedTab: INTEGRATION_TABS.ACTIVE,
        }),
      );
    },
    [
      dispatch,
      actions,
      currentPageId,
      applicationId,
      props.datasourceId,
      dataSource,
    ],
  );

  return (
    <>
      {props.templates.map((template) => {
        return (
          <MenuItem
            key={template.title}
            onSelect={() => {
              createQueryAction(template);
              props.onSelect();
            }}
          >
            {template.title}
          </MenuItem>
        );
      })}
    </>
  );
}

export default QueryTemplates;
