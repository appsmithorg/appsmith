import React, { useCallback, useState } from "react";
import styled from "styled-components";
import { Button, Text } from "design-system";
import type { Item } from "../../components/ListView";
import ListView from "../../components/ListView";
import classNames from "classnames";

const PaneTitleBar = styled.div`
  background-color: #fff8f8;
  padding: 4px 8px;
  border-bottom: 1px solid #fbe6dc;
  display: grid;
  grid-template-columns: 40px 1fr 60px;
  height: 32px;
  align-content: center;
  border-bottom: 1px solid #fbe6dc;
`;
const Body = styled.div`
  height: calc(100% - 35px);
  overflow-y: scroll;
`;
const TabsContainer = styled.div`
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  overflow: hidden;
  overflow-y: hidden;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
`;
const Tab = styled.div`
  padding: 4px;
  align-items: center;
  justify-content: center;
  display: grid;
  grid-template-columns: max-content 1fr;
  grid-gap: 3px;
  border-radius: 4px;
  &:hover {
    background-color: #fbe6dc;
    cursor: pointer;
  }
  span {
    font-weight: 400;
  }
  &.selected {
    background-color: #fbe6dc;
    span {
      font-weight: 600;
    }
  }
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
  const [pageState, setPageState] = useState<TabState>(TabState.EDIT);
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
            isIconButton
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
        {pageState === TabState.EDIT ? (
          <TabsContainer>
            {props.listItems?.map((item) => {
              return (
                <Tab
                  className={classNames({ selected: item.selected })}
                  key={item.key}
                  onClick={() => onListClick(item)}
                >
                  {item.icon}
                  <Text kind="body-s">{item.name}</Text>
                </Tab>
              );
            })}
          </TabsContainer>
        ) : (
          <div />
        )}
        {/*TABS end*/}
        {/*RIGHT ICON start*/}
        {pageState === TabState.EDIT ? (
          <Button kind="secondary" onClick={() => setPageState(TabState.LIST)}>
            more
          </Button>
        ) : (
          <Button
            className="justify-self-end"
            isIconButton
            kind={"secondary"}
            onClick={() => setPageState(TabState.EDIT)}
            startIcon={"close"}
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
