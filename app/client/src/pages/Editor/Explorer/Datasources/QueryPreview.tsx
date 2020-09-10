import React, { useState, useCallback } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import HighlightedCode from "components/editorComponents/HighlightedCode";
import { Collapse } from "@blueprintjs/core";
import { useDispatch, useSelector } from "react-redux";
import { createActionRequest } from "actions/actionActions";
import { AppState } from "reducers";
import { createNewQueryName } from "utils/AppsmithUtils";
import { getCurrentPageId } from "selectors/editorSelectors";
import { QueryAction } from "entities/Action";

const Container = styled.div`
  background-color: #2b2b2b;
  color: ${props => props.theme.colors.textOnDarkBG};
  padding: 11px 11px 11px 11px;
  width: 250px;
`;

const TemplateType = styled.div<{ color: string }>`
  color: ${props => props.color};
  &:hover {
    cursor: pointer;
  }
  &:not(:first-child) {
    margin-top: 15px;
  }
`;

const TemplateQueryWrapper = styled.div`
  flex-direction: row;
  display: flex;
  &&&& {
    code {
      border: none;
      box-shadow: none;
      background: none;
      margin-left: 4px;
      line-height: initial;
    }
  }
`;

export const QueryPreview = (props: any) => {
  return (
    <Container>
      {[1, 2, 4].map(e => {
        return (
          <CollapseTemplate
            key={`collapse-${e}`}
            datasourceId={props.datasourceId}
          />
        );
      })}
    </Container>
  );
};

const CollapseTemplate = (props: any) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TemplateType
        onClick={() => setIsOpen(!isOpen)}
        color={isOpen ? Colors.WHITE : "#D4D4D4"}
      >
        SELECT
      </TemplateType>
      <Collapse isOpen={isOpen} keepChildrenMounted={true}>
        {[1, 2, 4].map(e => {
          return <TemplateQuery key={e} datasourceId={props.datasourceId} />;
        })}
      </Collapse>
    </>
  );
};

const TemplateQuery = (props: any) => {
  const dispatch = useDispatch();
  const actions = useSelector((state: AppState) => state.entities.actions);
  const currentPageId = useSelector(getCurrentPageId);

  const createQueryAction = useCallback(() => {
    const newQueryName = createNewQueryName(actions, currentPageId || "");
    const queryactionConfiguration: Partial<QueryAction> = {
      actionConfiguration: { body: "select * from trips" },
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
  }, [dispatch]);

  return (
    <TemplateQueryWrapper onClick={createQueryAction}>
      <div style={{ marginTop: "15px", display: "flex", flexDirection: "row" }}>
        <div>All trips </div>
        <HighlightedCode codeText={"SELECT * FROM trips;"} />
      </div>
    </TemplateQueryWrapper>
  );
};

export default QueryPreview;
