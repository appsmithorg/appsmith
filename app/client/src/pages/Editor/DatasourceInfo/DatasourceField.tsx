import React, { useRef } from "react";

import styled from "styled-components";
import type { DatasourceColumns, DatasourceKeys } from "entities/Datasource";
import { Tooltip, Checkbox } from "design-system";
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

interface DatabaseFieldProps {
  field: DatasourceColumns | DatasourceKeys;
  step: number;
}

export function DatabaseColumns(props: DatabaseFieldProps) {
  const { field, step } = props;
  const { name, type } = field;
  const nameRef = useRef<HTMLDivElement | null>(null);

  return (
    <Wrapper className="t--datasource-column" step={step}>
      <Content>
        <Checkbox />
        <Tooltip
          content={name}
          isDisabled={!!isEllipsisActive(nameRef.current)}
          mouseEnterDelay={2}
          showArrow={false}
        >
          <FieldName ref={nameRef}>{name}</FieldName>
        </Tooltip>
        <FieldValue>{type}</FieldValue>
      </Content>
    </Wrapper>
  );
}

export default DatabaseColumns;
