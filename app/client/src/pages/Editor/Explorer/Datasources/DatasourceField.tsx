import React from "react";
import { Popover, Position, PopoverInteractionKind } from "@blueprintjs/core";
import {
  DATASOURCE_FIELD_ICONS_MAP,
  datasourceColumnIcon,
} from "../ExplorerIcons";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { DatasourceColumns, DatasourceKeys } from "entities/Datasource";

const Wrapper = styled.div<{ step: number }>`
  padding-left: ${(props) =>
    props.step * props.theme.spaces[2] + props.theme.spaces[6]}px;
  flex-direction: row;
  display: flex;
  height: 30px;
  width: 100%;
  &:hover {
    background: ${Colors.Gallery};
  }
  align-items: center;
  cursor: pointer;
`;

const FieldName = styled.div`
  color: ${Colors.GREY_9};
  flex: 1;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  line-height: 13px;
  text-overflow: ellipsis;
  padding-right: 30px;
`;

const FieldValue = styled.div`
  text-align: right;
  font-size: 10px;
  line-height: 12px;
  color: #777777;
  font-weight: 300;
`;

const Content = styled.div`
  margin: 0px 4px;
  flex: 1;
  flex-direction: row;
  min-width: 0;
  display: flex;
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
  background-color: ${Colors.WHITE};
  padding: 11px;
`;

const PopupValue = styled.div`
  color: ${Colors.GREY_9};
  font-size: 12px;
  :nth-child(2) {
    text-align: right;
    font-size: 10px;
    color: #777777;
    padding-top: 3px;
    font-weight: 300;
  }
`;

type DatabaseFieldProps = {
  field: DatasourceColumns | DatasourceKeys;
  step: number;
};

export function DatabaseColumns(props: DatabaseFieldProps) {
  const field = props.field;
  const fieldName = field.name;
  const fieldType = field.type;
  const icon = DATASOURCE_FIELD_ICONS_MAP[fieldType] || datasourceColumnIcon;

  const content = (
    <Wrapper className="t--datasource-column" step={props.step}>
      {icon}
      <Content>
        <FieldName>{fieldName}</FieldName>
        <FieldValue>{fieldType}</FieldValue>
      </Content>
    </Wrapper>
  );

  return (
    <Popover
      boundary={"viewport"}
      hoverCloseDelay={0}
      interactionKind={PopoverInteractionKind.HOVER}
      minimal
      position={Position.RIGHT_TOP}
    >
      {content}
      <Container>
        {icon}
        <PopoverContent>
          <PopupValue>{fieldName}</PopupValue>
          <PopupValue>{fieldType}</PopupValue>
        </PopoverContent>
      </Container>
    </Popover>
  );
}

export default DatabaseColumns;
