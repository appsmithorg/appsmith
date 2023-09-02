import React from "react";
import styled from "styled-components";
import classNames from "classnames";

export type Item = {
  key: string;
  name: string;
  icon?: React.ReactNode;
  selected?: boolean;
  [key: string]: any;
};

type Props = {
  items: Array<Item>;
  onClick: (item: Item) => void;
};

const Container = styled.div`
  padding: 5px;
  height: 100%;
  overflow-y: scroll;
`;
const ListItem = styled.div`
  padding: 8px;
  margin-bottom: 4px;
  display: grid;
  grid-template-columns: 30px 1fr;
  align-items: center;
  border-radius: 4px;
  height: 35px;
  &:hover {
    cursor: pointer;
    background-color: #f1f5f9;
  }
  &.selected {
    background: #fbe6dc;
  }
`;

const ListView = (props: Props) => {
  return (
    <Container>
      {props.items.map((item) => {
        return (
          <ListItem
            className={classNames({
              selected: !!item.selected,
            })}
            key={item.key}
            onClick={() => props.onClick(item)}
          >
            {item.icon || <div />}
            {item.name}
          </ListItem>
        );
      })}
    </Container>
  );
};

export default ListView;
