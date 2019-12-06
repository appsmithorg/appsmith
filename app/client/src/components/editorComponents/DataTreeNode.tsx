import React from "react";
import { TreeMenuItem } from "react-simple-tree-menu";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";

const NodeWrapper = styled.li<{ level: number; isActive?: boolean }>`
  & {
    width: 100%;
    display: flex;
    align-items: center;
    min-height: 32px;
    padding-left: ${props => props.level * 2}em;
    background-color: ${props => (props.isActive ? "#e9faf3" : "white")};
    cursor: pointer;
    &:hover {
      background-color: #e9faf3;
    }
  }
`;

const CaretIcon = styled(Icon)`
  color: #a3b3bf;
`;

const Label = styled.div`
    color: ${props => props.theme.colors.textDefault}
    display: flex;
    flex-wrap: wrap;
    flex: none;
    max-width: 70%;
    padding-right: 5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const Type = styled.span`
  color: #737e8a;
  flex: 2;
`;

type Props = {
  item: TreeMenuItem;
};

const DataTreeNode = ({ item }: Props) => (
  <NodeWrapper
    onClick={item.hasNodes && item.toggleNode ? item.toggleNode : item.onClick}
    level={item.level}
    isActive={item.focused}
  >
    <CaretIcon
      icon={
        item.hasNodes ? (item.isOpen ? "caret-down" : "caret-right") : "dot"
      }
    />
    <Label>{item.labelRender}</Label>
    <Type>//{item.type}</Type>
  </NodeWrapper>
);

export default DataTreeNode;
