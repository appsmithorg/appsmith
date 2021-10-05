import React from "react";
import { Tooltip } from "@blueprintjs/core";
import styled from "styled-components";
import { ControlIcons } from "icons/ControlIcons";
import { Colors } from "constants/Colors";
const DeleteIcon = ControlIcons.DELETE_CONTROL;
const deleteControlIcon = <DeleteIcon height={14} width={10} />;

const StyledDeleteIcon = styled.div`
  justify-self: flex-start;
  cursor: pointer;
  align-self: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  margin-right: 2px;
  background: ${(props) => props.theme.colors.widgetBorder};
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 2px;
  & > span {
    height: 12px;
  }
  &:hover {
    background: ${Colors.OUTER_SPACE};
  }
`;

type DeleteControlProps = {
  deleteWidget: () => void;
  show: boolean;
};

function DeleteControl(props: DeleteControlProps) {
  return props.show ? (
    <StyledDeleteIcon
      className="control t--widget-delete-control"
      onClick={props.deleteWidget}
    >
      <Tooltip content="Delete" hoverOpenDelay={500} position="top">
        {deleteControlIcon}
      </Tooltip>
    </StyledDeleteIcon>
  ) : null;
}
export default DeleteControl;
