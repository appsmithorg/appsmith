import React from "react";
import List from "./List";
import styled from "styled-components";
import { Flex } from "@appsmith/ads";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import { EditorViewMode } from "ee/entities/IDE/constants";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;
  }
`;

const QueryExplorer = () => {
  const ideViewMode = useSelector(getIDEViewMode);

  if (ideViewMode === EditorViewMode.FullScreen) {
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
  }

  return null;
};

export { QueryExplorer };
