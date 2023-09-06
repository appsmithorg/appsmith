import React, { useCallback } from "react";
import { jsCollectionIdURL } from "RouteBuilder";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { selectFilesForExplorer } from "selectors/entitiesSelector";
import history, { NavigationMethod } from "utils/history";
import JSEditor from "./JSEditor";
import PagePaneContainer from "../PagePaneContainer";
import { createNewJSCollection } from "actions/jsPaneActions";
import { JsFileIconV2 } from "pages/Editor/Explorer/ExplorerIcons";
import { getIdeSidebarWidth } from "pages/IDE/ideSelector";
import styled from "styled-components";

const Wrapper = styled.div<{ width: number }>`
  height: 100%;
  width: ${(props) => props.width}px;
  overflow: hidden;
`;

type Props = RouteComponentProps<{
  appId: string;
  pageId: string;
  collectionId?: string;
}>;

function JSObjects(props: Props) {
  const { collectionId, pageId } = props.match.params;
  const leftPaneWidth = useSelector(getIdeSidebarWidth);
  const dispatch = useDispatch();
  const addItemClick = useCallback(() => {
    dispatch(createNewJSCollection(pageId, "ENTITY_EXPLORER"));
  }, []);
  const allJSActions = useSelector(selectFilesForExplorer);
  const toListActions = allJSActions
    .filter((a: any) => {
      return a.type === "JS";
    })
    .map((a: any) => ({
      name: a.entity.name,
      key: a.entity.id,
      type: a.type,
      icon: JsFileIconV2(16, 16),
      selected: a.entity.id === collectionId,
    }));

  const listItemClick = useCallback((a) => {
    history.push(
      jsCollectionIdURL({
        pageId,
        collectionId: a.key,
      }),
      { invokedBy: NavigationMethod.EntityExplorer },
    );
  }, []);

  const editor = collectionId ? (
    <Wrapper width={leftPaneWidth}>
      <JSEditor />
    </Wrapper>
  ) : (
    <div />
  );

  return (
    <PagePaneContainer
      editor={editor}
      listItems={toListActions}
      onAddClick={addItemClick}
      onListClick={listItemClick}
    />
  );
}

export default JSObjects;
