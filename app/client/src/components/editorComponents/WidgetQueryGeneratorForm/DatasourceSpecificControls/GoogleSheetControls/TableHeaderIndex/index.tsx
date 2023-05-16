import {
  createMessage,
  GEN_CRUD_TABLE_HEADER_LABEL,
  GEN_CRUD_TABLE_HEADER_TOOLTIP_DESC,
} from "@appsmith/constants/messages";
import { Colors } from "constants/Colors";
import { Icon, IconSize, TooltipComponent as Tooltip } from "design-system-old";
import React, { memo } from "react";
import {
  ErrorMessage,
  Row,
  RowHeading,
  SelectWrapper,
  TooltipWrapper,
} from "../../../styles";
import styled from "styled-components";
import { useTableHeaderIndex } from "./useTableHeader";
import { Input } from "design-system-new";

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
              hoverOpenDelay={200}
            >
              <RoundBg>
                <Icon
                  fillColor={Colors.WHITE}
                  hoverFillColor={Colors.WHITE}
                  name="help"
                  size={IconSize.XXS}
                />
              </RoundBg>
            </Tooltip>
          </TooltipWrapper>
        </Row>
        <Input
          onChange={onChange}
          placeholder="Table Header Index"
          value={value.toString()}
        />
        <ErrorMessage>{error}</ErrorMessage>
      </SelectWrapper>
    );
  } else {
    return null;
  }
});
