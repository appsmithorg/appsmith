import React from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Position,
} from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import { ReactComponent as DownloadIcon } from "assets/icons/control/download-data-icon.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/TableComponent/Constants";
import TableAction, {
  TableIconWrapper,
} from "components/designSystems/appsmith/TableComponent/TableAction";
import styled from "styled-components";
import { transformTableDataIntoCsv } from "./CommonUtilities";
import zipcelx from "zipcelx";

const DropDownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  z-index: 1;
  border-radius: 4px;
  box-shadow: 0px 12px 28px -8px rgba(0, 0, 0, 0.1);
  padding: 0;
`;

const OptionWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  box-sizing: border-box;
  padding: 6px 12px;
  color: ${Colors.CHARCOAL};
  min-width: 200px;
  cursor: pointer;
  background: ${Colors.WHITE};
  border-left: none;
  border-radius: none;
  .option-title {
    font-weight: 500;
    font-size: 13px;
    line-height: 20px;
  }
  &:hover {
    background: ${Colors.SEA_SHELL};
    color: ${Colors.CODE_GRAY};
  }
`;
interface TableDataDownloadProps {
  data: Array<Record<string, unknown>>;
  columns: ReactTableColumnProps[];
  widgetName: string;
}

type FileDownloadType = "CSV" | "EXCEL";

type DataCellProps = {
  value: string | number;
  type: "string" | "number";
};

interface DownloadOptionProps {
  label: string;
  value: FileDownloadType;
}

const dowloadOptions: DownloadOptionProps[] = [
  {
    label: "Download as CSV",
    value: "CSV",
  },
  {
    label: "Download as Excel",
    value: "EXCEL",
  },
];

const downloadDataAsCSV = (props: {
  csvData: Array<Array<any>>;
  fileName: string;
}) => {
  let csvContent = "";
  props.csvData.forEach((infoArray: Array<any>, index: number) => {
    const dataString = infoArray.join(",");
    csvContent += index < props.csvData.length ? dataString + "\n" : dataString;
  });
  const anchor = document.createElement("a");
  const mimeType = "application/octet-stream";
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(
      new Blob([csvContent], {
        type: mimeType,
      }),
      props.fileName,
    );
  } else if (URL && "download" in anchor) {
    anchor.href = URL.createObjectURL(
      new Blob([csvContent], {
        type: mimeType,
      }),
    );
    anchor.setAttribute("download", props.fileName);
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
};

function TableDataDownload(props: TableDataDownloadProps) {
  const [selected, selectMenu] = React.useState(false);
  const downloadFile = (type: string) => {
    if (type === "CSV") {
      downloadTableDataAsCsv();
    } else if (type === "EXCEL") {
      downloadTableDataAsExcel();
    }
  };
  const downloadTableDataAsExcel = () => {
    const tableData: Array<Array<DataCellProps>> = [];
    const tableHeaders: Array<DataCellProps> = props.columns
      .filter((column: ReactTableColumnProps) => {
        return column.metaProperties && !column.metaProperties.isHidden;
      })
      .map((column: ReactTableColumnProps) => {
        return {
          value: column.Header,
          type:
            column.columnProperties?.columnType === "number"
              ? "number"
              : "string",
        };
      });
    tableData.push(tableHeaders);
    for (let row = 0; row < props.data.length; row++) {
      const data: { [key: string]: any } = props.data[row];
      const tableRow: Array<DataCellProps> = [];
      for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
        const column = props.columns[colIndex];
        const type =
          column.columnProperties?.columnType === "number"
            ? "number"
            : "string";
        if (column.metaProperties && !column.metaProperties.isHidden) {
          tableRow.push({
            value: data[column.accessor],
            type: type,
          });
        }
      }
      tableData.push(tableRow);
    }
    zipcelx({
      filename: props.widgetName,
      sheet: {
        data: tableData,
      },
    });
  };
  const downloadTableDataAsCsv = () => {
    selectMenu(true);
    const csvData = transformTableDataIntoCsv({
      columns: props.columns,
      data: props.data,
    });
    downloadDataAsCSV({
      csvData: csvData,
      fileName: `${props.widgetName}.csv`,
    });
    selectMenu(false);
  };

  const handleCloseMenu = () => {
    selectMenu(false);
  };

  if (props.columns.length === 0) {
    return (
      <TableIconWrapper disabled>
        <IconWrapper color={Colors.CADET_BLUE} height={20} width={20}>
          <DownloadIcon />
        </IconWrapper>
        <span className="action-title">Download</span>
      </TableIconWrapper>
    );
  }
  return (
    <Popover
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      isOpen={selected}
      minimal
      onClose={handleCloseMenu}
      position={Position.BOTTOM}
    >
      <TableAction
        className="t--table-download-btn"
        selectMenu={selectMenu}
        selected={selected}
        title="Download"
      >
        <DownloadIcon />
      </TableAction>
      <DropDownWrapper>
        {dowloadOptions.map((item: DownloadOptionProps, index: number) => {
          return (
            <OptionWrapper
              className={`${Classes.POPOVER_DISMISS} t--table-download-data-option`}
              key={index}
              onClick={() => {
                downloadFile(item.value);
              }}
            >
              {item.label}
            </OptionWrapper>
          );
        })}
      </DropDownWrapper>
    </Popover>
  );
}

export default TableDataDownload;
