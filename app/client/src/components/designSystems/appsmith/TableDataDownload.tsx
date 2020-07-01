import React from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Position,
} from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ReactComponent as DownloadIcon } from "assets/icons/control/download-table.svg";
import Button from "components/editorComponents/Button";

const TableIconWrapper = styled.div<{ selected: boolean }>`
  background: ${props => (props.selected ? "#EBEFF2" : "transparent")};
  box-shadow: ${props =>
    props.selected ? "inset 0px 4px 0px #29CCA3" : "none"};
  width: 48px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const DropDownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  z-index: 1;
  border-radius: 4px;
  border: 1px solid ${Colors.ATHENS_GRAY};
`;

const ButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  align-items; center;
  height: 40px;
  box-sizing: border-box;
  min-width: 224px;
  padding: 5px 15px;
  background: ${Colors.WHITE};
  box-shadow: 0px -1px 2px rgba(67, 70, 74, 0.12);
  margin-top: 10px;
`;

interface TableDataDownloadProps {
  data: object[];
  widgetId: string;
}

const TableDataDownload = (props: TableDataDownloadProps) => {
  const [selected, selectMenu] = React.useState(false);
  const downloadTableData = () => {
    console.log("button click", props.data);
  };

  return (
    <Popover
      minimal
      usePortal
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM}
      onClose={() => {
        selectMenu(false);
      }}
    >
      <TableIconWrapper
        selected={selected}
        onClick={() => {
          selectMenu(true);
        }}
      >
        <IconWrapper
          width={20}
          height={20}
          color={selected ? "#2E3D49" : "#A3B3BF"}
        >
          <DownloadIcon />
        </IconWrapper>
      </TableIconWrapper>
      <DropDownWrapper>
        <ButtonWrapper className={Classes.POPOVER_DISMISS}>
          <Button
            intent="primary"
            text="Download CSV"
            filled
            size="small"
            onClick={downloadTableData}
          />
        </ButtonWrapper>
      </DropDownWrapper>
    </Popover>
  );
};

export default TableDataDownload;
