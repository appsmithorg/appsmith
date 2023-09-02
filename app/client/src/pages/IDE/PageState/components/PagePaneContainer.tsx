import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { Button } from "design-system";
import type { Item } from "../../components/ListView";
import ListView from "../../components/ListView";

const PaneTitleBar = styled.div`
  background-color: #fff8f8;
  padding: 4px 12px;
  border-bottom: 1px solid #fbe6dc;
  display: grid;
  grid-template-columns: 20px 1fr 40px;
`;
const Body = styled.div`
  height: calc(100% - 35px);
`;

type Props = {
  editor: React.ReactNode;
  addItems?: Array<Item>;
  listItems?: Array<Item>;
  onAddClick?: (item?: Item) => void;
  onListClick?: (item: Item) => void;
};

enum TabState {
  ADD = "ADD",
  EDIT = "EDIT",
  LIST = "LIST",
}

const PagePaneContainer = (props: Props) => {
  const [pageState, setPageState] = useState<TabState>(TabState.LIST);
  const onAddClick = useCallback((item: Item) => {
    if (props.onAddClick) {
      props.onAddClick(item);
    }
    setPageState(TabState.EDIT);
  }, []);

  const onListClick = useCallback((item: Item) => {
    if (props.onListClick) {
      props.onListClick(item);
    }
    setPageState(TabState.EDIT);
  }, []);

  return (
    <div className="h-full">
      <PaneTitleBar>
        {/*LEFT ICON start*/}
        {pageState === TabState.EDIT ? (
          <Button
            kind={"secondary"}
            onClick={() => {
              if (props.addItems) {
                setPageState(TabState.ADD);
              } else if (props.onAddClick) {
                props.onAddClick();
              }
            }}
            startIcon={"plus"}
          />
        ) : (
          <div />
        )}
        {/*LEFT ICON end*/}
        {/*TABS start*/}
        <div />
        {/*TABS end*/}
        {/*RIGHT ICON start*/}
        {pageState === TabState.EDIT ? (
          <Button kind="secondary" onClick={() => setPageState(TabState.LIST)}>
            more
          </Button>
        ) : (
          <Button
            kind={"secondary"}
            onClick={() => setPageState(TabState.EDIT)}
            startIcon={"cross"}
          />
        )}
        {/*RIGHT ICON end*/}
      </PaneTitleBar>
      <Body>
        {pageState === TabState.ADD && props.addItems?.length && (
          <ListView items={props.addItems} onClick={onAddClick} />
        )}
        {pageState === TabState.LIST && props.listItems?.length && (
          <ListView items={props.listItems} onClick={onListClick} />
        )}
        {pageState === TabState.EDIT && props.editor}
      </Body>
    </div>
  );
};

export default PagePaneContainer;
