import React, { useCallback } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useDispatch, useSelector } from "react-redux";
import { createActionRequest } from "actions/actionActions";
import { AppState } from "reducers";
import { createNewQueryName } from "utils/AppsmithUtils";
import { getCurrentPageId } from "selectors/editorSelectors";
import { QueryAction } from "entities/Action";
import { Classes } from "@blueprintjs/core";
import { QueryTemplate } from "api/DatasourcesApi";

const Container = styled.div`
  background-color: ${props => props.theme.colors.blackShades[3]};
  color: ${props => props.theme.colors.textOnDarkBG};
  width: 250px;
`;

const TemplateType = styled.div`
  color: ${props => props.theme.colors.blackShades[7]};
  padding: 8px;
  &:hover {
    cursor: pointer;
    color: ${Colors.WHITE};
    background: ${Colors.TUNDORA};
  }
`;

type QueryTemplatesProps = {
  templates: QueryTemplate[];
  datasourceId: string;
};

export const QueryTemplates = (props: QueryTemplatesProps) => {
  const dispatch = useDispatch();
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);

  const createQueryAction = useCallback(
    (template: QueryTemplate) => {
      const newQueryName = createNewQueryName(actions, currentPageId || "");
      const queryactionConfiguration: Partial<QueryAction> = {
        actionConfiguration: { body: template.body },
      };

      dispatch(
        createActionRequest({
          name: newQueryName,
          pageId: currentPageId,
          datasource: {
            id: props.datasourceId,
          },
          ...queryactionConfiguration,
        }),
      );
    },
    [dispatch],
  );

  return (
    <Container>
      {props.templates.map(template => {
        return (
          <TemplateType
            key={template.title}
            className={Classes.POPOVER_DISMISS}
            onClick={() => createQueryAction(template)}
          >
            {template.title}
          </TemplateType>
        );
      })}
    </Container>
  );
};

export default QueryTemplates;
