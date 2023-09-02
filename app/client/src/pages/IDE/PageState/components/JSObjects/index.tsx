import React, { useCallback } from "react";
import { jsCollectionIdURL } from "RouteBuilder";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import { selectFilesForExplorer } from "selectors/entitiesSelector";
import history, { NavigationMethod } from "utils/history";
import JSEditor from "./JSEditor";
import PagePaneContainer from "../PagePaneContainer";
import { createNewJSCollection } from "actions/jsPaneActions";

type Props = RouteComponentProps<{
  appId: string;
  pageId: string;
  collectionId?: string;
}>;

function JSObjects(props: Props) {
  const { pageId } = props.match.params;
  const dispatch = useDispatch();
  const addItemClick = useCallback(() => {
    dispatch(createNewJSCollection(pageId, "ENTITY_EXPLORER"));
  }, []);
  const allJSActions = useSelector(selectFilesForExplorer);
  const toListActions = allJSActions
    .filter((a: any) => {
      if (a.type === "JS") {
        return true;
      }
      return false;
    })
    .map((a: any) => ({
      name: a.entity.name,
      key: a.entity.id,
      type: a.type,
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

  return (
    <PagePaneContainer
      editor={<JSEditor />}
      listItems={toListActions}
      onAddClick={addItemClick}
      onListClick={listItemClick}
    />
  );
}

export default JSObjects;
