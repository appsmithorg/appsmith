import React from "react";
import List from "./List";
import styled from "styled-components";
import { Flex } from "design-system";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const QueryExplorer = () => {
  return (
    <QueriesContainer
      className="ide-editor-left-pane__content-queries"
      flexDirection="column"
      height="100%"
      overflow="hidden"
    >
      <List />
    </QueriesContainer>
  );
};

export { QueryExplorer };
