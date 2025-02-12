import React from "react";
import styled from "styled-components";
import { Flex } from "@appsmith/ads";

import { useCurrentEditorState } from "../../hooks/useCurrentEditorState";
import { EditorEntityTab } from "IDE/Interfaces/EditorTypes";
import ListQuery from "../QueryList/List";
import ListJSObjects from "../JSExplorer/JSSegmentList";

const ListContainer = styled(Flex)`
  position: absolute;
  top: 32px;
  padding-top: 4px;
  & .t--entity-item {
    grid-template-columns: 0 auto 1fr auto auto auto auto auto;
    height: 32px;
  }
`;

export const List = () => {
  const { segment } = useCurrentEditorState();

  return (
    <ListContainer
      bg="var(--ads-v2-color-bg)"
      data-testid="t--editorpane-list-view"
      h="calc(100% - 32px)"
      w="100%"
      zIndex="10"
    >
      {segment === EditorEntityTab.QUERIES ? <ListQuery /> : <ListJSObjects />}
    </ListContainer>
  );
};
