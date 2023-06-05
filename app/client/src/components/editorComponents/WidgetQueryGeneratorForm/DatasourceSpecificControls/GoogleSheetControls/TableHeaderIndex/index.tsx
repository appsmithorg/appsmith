import {
  createMessage,
  GEN_CRUD_TABLE_HEADER_LABEL,
  GEN_CRUD_TABLE_HEADER_TOOLTIP_DESC,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import { Icon } from "design-system";
import { Tooltip } from "design-system";
import React, { memo } from "react";
import {
  Row,
  RowHeading,
  SelectWrapper,
  TooltipWrapper,
} from "../../../styles";
import styled from "styled-components";
import { useTableHeaderIndex } from "./useTableHeader";
import { Input } from "design-system";

const RoundBg = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 16px;
  background-color: ${Colors.GRAY};
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default memo(function TableHeaderIndex() {
  const { error, onChange, show, value } = useTableHeaderIndex();

  if (show) {
    return (
      <SelectWrapper className="space-y-2">
        <Row>
          <RowHeading>{createMessage(GEN_CRUD_TABLE_HEADER_LABEL)}</RowHeading>
          <TooltipWrapper>
            <Tooltip
              content={createMessage(GEN_CRUD_TABLE_HEADER_TOOLTIP_DESC)}
            >
              <RoundBg>
                <Icon name="help" />
              </RoundBg>
            </Tooltip>
          </TooltipWrapper>
        </Row>
        <Input
          errorMessage={error}
          onChange={onChange}
          placeholder="Table Header Index"
          value={value.toString()}
        />
      </SelectWrapper>
    );
  } else {
    return null;
  }
});
