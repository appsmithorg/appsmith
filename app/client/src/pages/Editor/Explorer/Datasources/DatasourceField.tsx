import React from "react";
import {
  DATASOURCE_FIELD_ICONS_MAP,
  datasourceColumnIcon,
} from "../ExplorerIcons";
import styled from "styled-components";
import type { DatasourceColumns, DatasourceKeys } from "entities/Datasource";
import { EntityClassNames } from "pages/Editor/Explorer/Entity";
import { Menu, MenuContent, MenuTrigger } from "design-system";

const Wrapper = styled.div<{ step: number }>`
  padding-left: ${(props) =>
    props.step * props.theme.spaces[2] + props.theme.spaces[6]}px;
  flex-direction: row;
  display: flex;
  height: 30px;
  width: 100%;
  &:hover {
    background: var(--ads-v2-color-bg-subtle);
  }
  align-items: center;
  cursor: pointer;
`;

const FieldName = styled.div`
  color: var(--ads-v2-color-fg);
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
  background-color: var(--ads-v2-color-bg);
  padding: 11px;
`;

const PopupValue = styled.div`
  color: var(--ads-v2-color-fg);
  font-size: 12px;
  :nth-child(2) {
    text-align: right;
    font-size: 10px;
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
    <Menu>
      <MenuTrigger>{content}</MenuTrigger>
      <MenuContent align="start" side="right">
        <Container className={EntityClassNames.CONTEXT_MENU_CONTENT}>
          {icon}
          <PopoverContent>
            <PopupValue>{fieldName}</PopupValue>
            <PopupValue>{fieldType}</PopupValue>
          </PopoverContent>
        </Container>
      </MenuContent>
    </Menu>
  );
}

export default DatabaseColumns;
