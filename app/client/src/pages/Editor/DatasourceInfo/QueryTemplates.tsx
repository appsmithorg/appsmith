import React, { useCallback, useContext } from "react";
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
import { DatasourceStructureContext } from "entities/Datasource";
import { INTEGRATION_TABS } from "constants/routes";
import {
  getAction,
  getDatasource,
  getPlugin,
} from "@appsmith/selectors/entitiesSelector";
import { integrationEditorURL } from "@appsmith/RouteBuilder";
import { MenuItem, Tag } from "design-system";
import type { Plugin } from "api/PluginApi";

import WalkthroughContext from "components/featureWalkthrough/walkthroughContext";
import { setFeatureWalkthroughShown } from "utils/storage";
import styled from "styled-components";
import { change, getFormValues } from "redux-form";
import { QUERY_EDITOR_FORM_NAME } from "@appsmith/constants/forms";
import { diff } from "deep-diff";
import { UndoRedoToastContext, showUndoRedoToast } from "utils/replayHelpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { FEATURE_WALKTHROUGH_KEYS } from "constants/WalkthroughConstants";
import { SUGGESTED_TAG, createMessage } from "@appsmith/constants/messages";
import { transformTextToSentenceCase } from "pages/Editor/utils";

interface QueryTemplatesProps {
  templates: QueryTemplate[];
  datasourceId: string;
  onSelect: () => void;
  context: DatasourceStructureContext;
  currentActionId: string;
}

enum QueryTemplatesEvent {
  EXPLORER_TEMPLATE = "explorer-template",
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
  const { isOpened: isWalkthroughOpened, popFeature } =
    useContext(WalkthroughContext) || {};
  const applicationId = useSelector(getCurrentApplicationId);
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);
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
            queryType: template.title,
          },
          ...queryactionConfiguration,
        }),
      );

      if (isWalkthroughOpened) {
        popFeature && popFeature("SCHEMA_QUERY_CREATE");
        setFeatureWalkthroughShown(FEATURE_WALKTHROUGH_KEYS.ds_schema, true);
      }

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
        isWalkthroughOpened,
      });

      if (isWalkthroughOpened) {
        popFeature && popFeature("SCHEMA_QUERY_UPDATE");
        setFeatureWalkthroughShown(FEATURE_WALKTHROUGH_KEYS.ds_schema, true);
      }

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
