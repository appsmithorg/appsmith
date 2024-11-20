import React, { useRef } from "react";
import { DATASOURCE_FIELD_ICONS_MAP } from "../Explorer/ExplorerIcons";
import styled from "styled-components";
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

const FieldKeyLabel = styled.span`
  &:first-letter {
    text-transform: capitalize;
  }
`;

interface FieldProps {
  name: string;
  type: string;
  keys?: string[];
}

interface DatabaseFieldProps {
  field: FieldProps;
  step: number;
}

export function DatabaseColumns(props: DatabaseFieldProps) {
  const field = props.field;
  const fieldName = field.name;
  const fieldType = field.type;
  const fieldKeys = field.keys;
  const icon =
    fieldKeys && fieldKeys.length > 0
      ? DATASOURCE_FIELD_ICONS_MAP[fieldKeys[0]]
      : null;
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
        <FieldValue>{fieldType}</FieldValue>
        {icon && fieldKeys && (
          <Tag isClosable={false} size="md">
            <Flex gap="spaces-1">
              {icon}
              <FieldKeyLabel>{fieldKeys[0]}</FieldKeyLabel>
            </Flex>
          </Tag>
        )}
      </Content>
    </Wrapper>
  );
}

export default DatabaseColumns;
