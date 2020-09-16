import React from "react";
import { Popover, Position } from "@blueprintjs/core";
import { queryIcon } from "../ExplorerIcons";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const Wrapper = styled.div<{ step: number }>`
  padding-left: ${props =>
    props.step * props.theme.spaces[2] + props.theme.spaces[6]}px;
  flex-direction: row;
  display: flex;
  height: 30px;
  width: 100%;
  &:hover {
    background: ${Colors.TUNDORA};
  }
  align-items: center;
  cursor: pointer;
`;

const Value = styled.div`
  color: ${Colors.ALTO};
  flex: 1;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  line-height: 13px;
  text-overflow: ellipsis;
  :nth-child(2) {
    text-align: right;
    font-size: 10px;
    line-height: 12px;
    color: #777777;
    font-weight: 300;
  }
`;

const Content = styled.div`
  margin: 0px 4px;
  flex: 1;
  flex-direction: row;
  min-width: 0;
  display: flex;
  padding-right: 10px;
  justify-content: space-between;
`;

const PopoverContent = styled.div`
  flex-direction: row;
  display: flex;
  flex: 1;
  gap: 30px;
  margin-left: 4px;
  align-items: flex-end;
  justify-content: space-between;
`;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  background-color: #2b2b2b;
  padding: 11px;
`;

const PopupValue = styled.div`
  color: ${Colors.ALTO};
  font-size: 12px;
  :nth-child(2) {
    text-align: right;
    font-size: 10px;
    color: #777777;
    padding-top: 3px;
    font-weight: 300;
  }
`;

export const DatabaseColumns = (props: any) => {
  const column = props.column;
  const columnName = column.name;
  const columnType = column.type;

  const content = (
    <Wrapper step={props.step + 1} className="t--datasource-column">
      {queryIcon}
      <Content>
        <Value>{columnName}</Value>
        <Value>{columnType}</Value>
      </Content>
    </Wrapper>
  );

  return (
    <Popover minimal position={Position.RIGHT_TOP} boundary={"viewport"}>
      {content}
      <Container>
        {queryIcon}
        <PopoverContent>
          <PopupValue>{columnName}</PopupValue>
          <PopupValue>{columnType}</PopupValue>
        </PopoverContent>
      </Container>
    </Popover>
  );
};

export default DatabaseColumns;
