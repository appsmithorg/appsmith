import React, { useCallback, useLayoutEffect } from "react";
import { jsCollectionIdURL } from "RouteBuilder";
import { useDispatch, useSelector } from "react-redux";
import type { RouteComponentProps } from "react-router";
import history, { NavigationMethod } from "utils/history";
import JSEditor from "./JSEditor";
import PagePaneContainer from "../PagePaneContainer";
import { createNewJSCollection } from "actions/jsPaneActions";
import { getIdeSidebarWidth, getRecentJsList } from "pages/IDE/ideSelector";
import styled from "styled-components";
import { importSvg } from "design-system-old";
import BlankState from "pages/IDE/components/BlankState";
import { setIdePageTabState } from "pages/IDE/ideActions";
import { TabState } from "pages/IDE/ideReducer";
import type { Item } from "../../../components/ListView";

const DataIcon = importSvg(
  () => import("pages/IDE/assets/icons/no-jsobjects.svg"),
);

const Wrapper = styled.div<{ width: number }>`
  height: 100%;
  width: ${(props) => props.width - 6}px;
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
  const sortedJsList: Item[] = useSelector(getRecentJsList);
  const toListActions = sortedJsList.map((a: any) => {
    const url = jsCollectionIdURL({
      pageId,
      collectionId: a.key,
    });
    return {
      ...a,
      selected: a.key === collectionId,
      url,
    };
  });
  const listItemClick = useCallback((a) => {
    history.push(a.url, { invokedBy: NavigationMethod.EntityExplorer });
  }, []);

  useLayoutEffect(() => {
    if (!collectionId) {
      if (toListActions.length) {
        listItemClick(toListActions[0]);
      }
    }
  }, [collectionId, toListActions.length]);

  const editor = collectionId ? (
    <Wrapper width={leftPaneWidth}>
      <JSEditor />
    </Wrapper>
  ) : (
    <div />
  );

  return (
    <PagePaneContainer
      blankState={
        <BlankState
          buttonText="New JS Object"
          description={
            "Use javascript to transform your data or write business logic"
          }
          image={DataIcon}
          onClick={() => {
            addItemClick();
            dispatch(setIdePageTabState(TabState.EDIT));
          }}
        />
      }
      editor={editor}
      listItems={toListActions}
      listStateTitle={`JS Objects in this page (${toListActions.length})`}
      onAddClick={addItemClick}
      onListClick={listItemClick}
      titleItemCounts={4}
    />
  );
}

export default JSObjects;
