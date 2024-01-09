import React from "react";
import { Flex } from "design-system";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { EditorViewMode } from "@appsmith/entities/IDE/constants";
import { getIDEViewMode, getIsSideBySideEnabled } from "selectors/ideSelectors";
import SplitScreenRoutes from "./SplitScreenRoutes";
import FullScreenRoutes from "./FullScreenRoutes";

const QueriesContainer = styled(Flex)`
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;

    & .t--entity-name {
      padding-left: var(--ads-v2-spaces-3);
    }
  }
`;

const QueriesSegment = () => {
  const isSideBySideEnabled = useSelector(getIsSideBySideEnabled);
  const editorMode = useSelector(getIDEViewMode);
  return (
    <QueriesContainer
      className="ide-editor-left-pane__content-queries"
      flexDirection="column"
      overflow="hidden"
    >
      {isSideBySideEnabled ? (
        editorMode === EditorViewMode.SplitScreen ? (
          <SplitScreenRoutes />
        ) : (
          <FullScreenRoutes />
        )
      ) : (
        <FullScreenRoutes />
      )}
    </QueriesContainer>
  );
};

export default QueriesSegment;
