import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createActionRequest } from "actions/pluginActionActions";
import type { AppState } from "ee/reducers";
import {
  getCurrentApplicationId,
  getCurrentBasePageId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import type { QueryAction } from "entities/Action";
import history from "utils/history";
import type { Datasource, QueryTemplate } from "entities/Datasource";
import type { DatasourceStructureContext } from "entities/Datasource";
import { INTEGRATION_TABS } from "constants/routes";
import {
  getAction,
  getDatasource,
  getPlugin,
} from "ee/selectors/entitiesSelector";
import { integrationEditorURL } from "ee/RouteBuilder";
import { MenuItem, Tag } from "@appsmith/ads";
import type { Plugin } from "entities/Plugin";

import styled from "styled-components";
import { change, getFormValues } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "ee/constants/forms";
import { diff } from "deep-diff";
import { UndoRedoToastContext, showUndoRedoToast } from "utils/replayHelpers";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { SUGGESTED_TAG, createMessage } from "ee/constants/messages";
import { transformTextToSentenceCase } from "pages/Editor/utils";

interface QueryTemplatesProps {
  templates: QueryTemplate[];
  datasourceId: string;
  onSelect: () => void;
  context: DatasourceStructureContext;
  currentActionId: string;
}

enum QueryTemplatesEvent {
  QUERY_EDITOR_TEMPLATE = "query-editor-template",
}

const TemplateMenuItem = styled(MenuItem)`
  & span {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  & .suggested_template {
    width: 30%;
  }
`;

export function QueryTemplates(props: QueryTemplatesProps) {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const actions = useSelector((state: AppState) => state.entities.actions);
  const basePageId = useSelector(getCurrentBasePageId);
  const pageId = useSelector(getCurrentPageId);
  const dataSource: Datasource | undefined = useSelector((state: AppState) =>
    getDatasource(state, props.datasourceId),
  );

  const currentAction = useSelector((state) =>
    getAction(state, props.currentActionId),
  );
  const formName = QUERY_EDITOR_FORM_NAME;

  const formValues = useSelector((state) => getFormValues(formName)(state));

  const plugin: Plugin | undefined = useSelector((state: AppState) =>
    getPlugin(state, !!dataSource?.pluginId ? dataSource.pluginId : ""),
  );
  const createQueryAction = useCallback(
    (template: QueryTemplate) => {
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
          pageId,
          pluginId: dataSource?.pluginId,
          datasource: {
            id: props.datasourceId,
          },
          eventData: {
            actionType: "Query",
            from: QueryTemplatesEvent.QUERY_EDITOR_TEMPLATE,
            dataSource: dataSource?.name,
            datasourceId: props.datasourceId,
            pluginName: plugin?.name,
            queryType: template.title,
          },
          ...queryactionConfiguration,
        }),
      );

      history.push(
        integrationEditorURL({
          basePageId,
          selectedTab: INTEGRATION_TABS.ACTIVE,
        }),
      );
    },
    [
      dispatch,
      actions,
      basePageId,
      applicationId,
      props.datasourceId,
      dataSource,
    ],
  );

  const updateQueryAction = useCallback(
    (template: QueryTemplate) => {
      if (!currentAction) return;

      const queryactionConfiguration: Partial<QueryAction> = {
        actionConfiguration: {
          body: template.body,
          pluginSpecifiedTemplates: template.pluginSpecifiedTemplates,
          formData: template.configuration,
          ...template.actionConfiguration,
        },
      };

      const newFormValueState = {
        ...formValues,
        ...queryactionConfiguration,
      };

      const differences = diff(formValues, newFormValueState) || [];

      differences.forEach((diff) => {
        if (diff.kind === "E" || diff.kind === "N") {
          const path = diff?.path?.join(".") || "";
          const value = diff?.rhs;

          if (path) {
            dispatch(change(QUERY_EDITOR_FORM_NAME, path, value));
          }
        }
      });

      AnalyticsUtil.logEvent("AUTOMATIC_QUERY_GENERATION", {
        datasourceId: props.datasourceId,
        pluginName: plugin?.name || "",
        templateCommand: template?.title,
      });

      showUndoRedoToast(
        currentAction.name,
        false,
        false,
        true,
        UndoRedoToastContext.QUERY_TEMPLATES,
      );
    },
    [
      dispatch,
      actions,
      basePageId,
      applicationId,
      props.datasourceId,
      dataSource,
    ],
  );

  return (
    <>
      {props.templates.map((template) => {
        return (
          <TemplateMenuItem
            key={template.title}
            onSelect={() => {
              if (props.currentActionId) {
                updateQueryAction(template);
              } else {
                createQueryAction(template);
              }

              props.onSelect();
            }}
          >
            {transformTextToSentenceCase(template.title)}
            {template?.suggested && (
              <Tag className="suggested_template" isClosable={false} size="md">
                {createMessage(SUGGESTED_TAG)}
              </Tag>
            )}
          </TemplateMenuItem>
        );
      })}
    </>
  );
}

export default QueryTemplates;
