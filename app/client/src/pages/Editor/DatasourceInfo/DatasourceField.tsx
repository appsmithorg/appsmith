import React, { useRef } from "react";
import { DATASOURCE_FIELD_ICONS_MAP } from "../Explorer/ExplorerIcons";
import styled from "styled-components";
import type { DatasourceColumns, DatasourceKeys } from "entities/Datasource";
import { Tooltip, Tag, Flex } from "@appsmith/ads";
import { isEllipsisActive } from "utils/helpers";

const Wrapper = styled.div<{ step: number }>`
  padding-left: ${(props) =>
    props.step * props.theme.spaces[2] + props.theme.spaces[6]}px;
  flex-direction: row;
  display: flex;
  height: 30px;
  width: 100%;
  align-items: center;
  flex-shrink: 0;
`;

const FieldName = styled.div`
  color: var(--ads-v2-color-fg);
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FieldValue = styled.div`
  color: var(--ads-v2-color-fg-subtle);
  text-align: right;
  font-size: 14px;
  font-weight: 300;
`;

const Content = styled.div`
  margin: 0px 4px;
  flex-direction: row;
  min-width: 0;
  display: flex;
  gap: var(--ads-v2-spaces-2);
`;

interface DatabaseFieldProps {
  field: DatasourceColumns | DatasourceKeys;
  step: number;
}

export function DatabaseColumns(props: DatabaseFieldProps) {
  const field = props.field;
  const fieldName = field.name;
  const fieldType = field.type;
  const icon = DATASOURCE_FIELD_ICONS_MAP[fieldType];
  const nameRef = useRef<HTMLDivElement | null>(null);

  return (
    <Wrapper className="t--datasource-column" step={props.step}>
      <Content>
        <Tooltip
          content={fieldName}
          isDisabled={!!isEllipsisActive(nameRef.current)}
          mouseEnterDelay={2}
          showArrow={false}
        >
          <FieldName ref={nameRef}>{fieldName}</FieldName>
        </Tooltip>
        {icon ? (
          <Tag isClosable={false} size="md">
            <Flex gap="spaces-2">
              {icon}
              {fieldType}
            </Flex>
          </Tag>
        ) : (
          <FieldValue>{fieldType}</FieldValue>
        )}
      </Content>
    </Wrapper>
  );
}

export default DatabaseColumns;
