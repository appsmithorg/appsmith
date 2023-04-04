import React, { useCallback } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";
import { createActionRequest } from "actions/pluginActionActions";
import type { AppState } from "@appsmith/reducers";
import { createNewQueryName } from "utils/AppsmithUtils";
import {
  getCurrentApplicationId,
  getCurrentPageId,
} from "selectors/editorSelectors";
import type { QueryAction } from "entities/Action";
import { Classes } from "@blueprintjs/core";
import history from "utils/history";
import type { Datasource, QueryTemplate } from "entities/Datasource";
import { INTEGRATION_TABS } from "constants/routes";
import { getDatasource } from "selectors/entitiesSelector";
import { integrationEditorURL } from "RouteBuilder";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";

const Container = styled.div`
  background-color: ${(props) => props.theme.colors.queryTemplate.bg};
  color: ${(props) => props.theme.colors.textOnDarkBG};
  min-width: 160px;
  padding: 5px;
`;

const TemplateType = styled.div`
  color: ${(props) => props.theme.colors.queryTemplate.color};
  padding: 8px;
  &:hover {
    cursor: pointer;
    background: ${Colors.Gallery};
  }
`;

type QueryTemplatesProps = {
  templates: QueryTemplate[];
  datasourceId: string;
};

export function QueryTemplates(props: QueryTemplatesProps) {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);
  const dataSource: Datasource | undefined = useSelector((state: AppState) =>
    getDatasource(state, props.datasourceId),
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
            from: "explorer-template",
            dataSource: dataSource?.name,
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
    <Container className={EntityClassNames.CONTEXT_MENU_CONTENT}>
      {props.templates.map((template) => {
        return (
          <TemplateType
            className={Classes.POPOVER_DISMISS}
            key={template.title}
            onClick={() => createQueryAction(template)}
          >
            {template.title}
          </TemplateType>
        );
      })}
    </Container>
  );
}

export default QueryTemplates;
