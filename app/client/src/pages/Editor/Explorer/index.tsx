import React from "react";
import styled from "styled-components";
import { useEntities } from "./hooks";
import { getPageEntityGroups } from "./helpers";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

const Wrapper = styled.div`
  padding: ${props => props.theme.spaces[3]}px;
`;

const EntityExplorer = () => {
  const { pages, widgetTree, actions, currentPageId } = useEntities();
  return (
    <Wrapper>
      {pages.map(page =>
        getPageEntityGroups(
          { id: page.pageId, name: page.pageName },
          [
            {
              type: ENTITY_TYPE.ACTION,
              entries: actions.filter(
                action => action.config.pageId === page.pageId,
              ),
            },
            {
              type: ENTITY_TYPE.WIDGET,
              entries: widgetTree.pageId === page.pageId ? widgetTree : [],
            },
          ],
          page.pageId === currentPageId,
        ),
      )}
    </Wrapper>
  );
};

export default EntityExplorer;
