import { jsCollectionIdURL } from "RouteBuilder";
import { useFilteredFileOperations } from "components/editorComponents/GlobalSearch/GlobalSearchHooks";
import { Button } from "design-system";
import { find } from "lodash";
import ListView from "pages/IDE/components/ListView";
import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import {
  getJSCollections,
  selectFilesForExplorer,
} from "selectors/entitiesSelector";
import styled from "styled-components";
import history, { NavigationMethod } from "utils/history";
import JSEditor from "./JSEditor";
import ListSubTitle from "pages/IDE/components/ListSubTitle";

type Props = RouteComponentProps<{
  appId: string;
  pageId: string;
  collectionId?: string;
}>;

enum TabState {
  ADD = "ADD",
  EDIT = "EDIT",
  LIST = "LIST",
}

const EmptyStateContainer = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function JSObjects(props: Props) {
  const { collectionId, pageId } = props.match.params;
  const dispatch = useDispatch();
  const [pageState, setPageState] = useState<TabState>(TabState.LIST);
  const jsCollections = useSelector(getJSCollections);
  const jsCollection = find(
    jsCollections,
    (jsCollection) => jsCollection.config.id === collectionId,
  );
  useEffect(() => {
    if (jsCollection) {
      setPageState(TabState.EDIT);
    } else if (jsCollections.length === 0) {
      setPageState(TabState.ADD);
    }
  }, []);
  const fileOperations = useFilteredFileOperations();
  const addOperations = fileOperations.map((op) => {
    return {
      name: op.title,
      icon: op.icon,
      key: op.title,
    };
  });
  const addItemClick = useCallback(
    (item: { key: string }) => {
      const operation = fileOperations.find((a) => a.title === item.key);
      if (operation) {
        if (operation.action) {
          dispatch(operation.action(pageId, "ENTITY_EXPLORER"));
        } else if (operation.redirect) {
          operation.redirect(pageId, "ENTITY_EXPLORER");
        }
      }
    },
    [fileOperations],
  );
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
    setPageState(TabState.EDIT);
  }, []);

  let title = "";
  let rightIcon: React.ReactNode = null;
  let leftIcon: React.ReactNode = null;
  let body: React.ReactNode = (
    <EmptyStateContainer>
      <h2>Select a query</h2>
    </EmptyStateContainer>
  );

  switch (pageState) {
    case TabState.ADD:
      title = "Add";
      rightIcon = (
        <Button
          kind={"secondary"}
          onClick={() => setPageState(TabState.EDIT)}
          startIcon={"cross"}
        />
      );
      body = <ListView items={addOperations} onClick={addItemClick} />;
      break;
    case TabState.LIST:
      title = `JS Objects on this page (${jsCollections.length})`;
      rightIcon = (
        <Button
          kind={"secondary"}
          onClick={() => setPageState(TabState.EDIT)}
          startIcon={"cross"}
        />
      );
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      body = <ListView items={toListActions} onClick={listItemClick} />;
      break;
    case TabState.EDIT:
      title = jsCollection?.config.name || "";
      rightIcon = (
        <Button kind={"secondary"} onClick={() => setPageState(TabState.LIST)}>
          {jsCollections.length - 1} More
        </Button>
      );
      leftIcon = (
        <Button
          isIconButton
          kind={"secondary"}
          onClick={() => setPageState(TabState.ADD)}
          startIcon={"plus"}
        />
      );
      if (collectionId && jsCollection) {
        body = <JSEditor />;
      }
      break;
  }

  return (
    <div className="h-full js-body-container overflow-hidden">
      <ListSubTitle
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        title={title || ""}
      />
      {body}
    </div>
  );
}

export default JSObjects;
