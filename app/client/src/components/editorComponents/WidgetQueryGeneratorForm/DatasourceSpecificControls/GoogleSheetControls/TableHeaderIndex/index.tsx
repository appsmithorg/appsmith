import {
  createMessage,
  GEN_CRUD_TABLE_HEADER_LABEL,
  GEN_CRUD_TABLE_HEADER_TOOLTIP_DESC,
} from "ee/constants/messages";
import { Colors } from "constants/Colors";
import { Icon } from "@appsmith/ads";
import { Tooltip } from "@appsmith/ads";
import React, { memo } from "react";
import { Label, Row, RowHeading, SelectWrapper } from "../../../styles";
import styled from "styled-components";
import { useTableHeaderIndex } from "./useTableHeader";
import { Input } from "@appsmith/ads";

const RoundBg = styled.div`
  width: 16px;
  border-radius: 16px;
  background-color: ${Colors.WHITE};
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default memo(function TableHeaderIndex() {
  const { error, onChange, show, value } = useTableHeaderIndex();

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        <Label>
          <Row>
            <RowHeading>
              {createMessage(GEN_CRUD_TABLE_HEADER_LABEL)}
            </RowHeading>
            <Tooltip
              content={createMessage(GEN_CRUD_TABLE_HEADER_TOOLTIP_DESC)}
            >
              <RoundBg>
                <Icon name="question-line" size="md" />
              </RoundBg>
            </Tooltip>
          </Row>
        </Label>
        <Input
          className="space-y-4"
          errorMessage={error}
          isRequired
          labelPosition="top"
          onChange={onChange}
          placeholder="Table header index"
          size="md"
          type="number"
          value={value.toString()}
        />
      </SelectWrapper>
    );
  } else {
    return null;
  }
});
