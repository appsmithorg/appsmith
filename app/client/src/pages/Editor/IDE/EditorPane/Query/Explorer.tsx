import React from "react";

import { EditorViewMode } from "ee/entities/IDE/constants";
import { useSelector } from "react-redux";
import { getIDEViewMode } from "selectors/ideSelectors";
import styled from "styled-components";

import { Flex } from "@appsmith/ads";

import List from "./List";

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
