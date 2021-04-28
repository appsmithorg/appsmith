import React from "react";
import {
  Popover,
  Classes,
  PopoverInteractionKind,
  Position,
} from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import { ReactComponent as DownloadIcon } from "assets/icons/control/download-table.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/TableComponent/Constants";
import { TableIconWrapper } from "components/designSystems/appsmith/TableComponent/TableStyledWrappers";
import TableActionIcon from "components/designSystems/appsmith/TableComponent/TableActionIcon";
import styled from "styled-components";
import { transformTableDataIntoCsv } from "./CommonUtilities";

const DropDownWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: white;
  z-index: 1;
  border-radius: 4px;
  border: 1px solid ${Colors.ATHENS_GRAY};
  padding: 8px;
`;

const OptionWrapper = styled.div`
  display: flex;
  width: calc(100% - 20px);
  justify-content: space-between;
  align-items: center;
  height: 32px;
  box-sizing: border-box;
  padding: 8px;
  color: ${Colors.OXFORD_BLUE};
  opacity: 0.7;
  min-width: 200px;
  cursor: pointer;
  margin-bottom: 4px;
  background: ${Colors.WHITE};
  border-left: none;
  border-radius: 4px;
  .option-title {
    font-weight: 500;
    font-size: 14px;
    line-height: 24px;
  }
  &:hover {
    background: ${Colors.POLAR};
  }
`;
interface TableDataDownloadProps {
  data: Array<Record<string, unknown>>;
  columns: ReactTableColumnProps[];
  widgetName: string;
}

type FileDownloadType = "CSV" | "EXCEL";

interface DownloadOptionProps {
  label: string;
  value: FileDownloadType;
}

const dowloadOptions: DownloadOptionProps[] = [
  {
    label: "CSV",
    value: "CSV",
  },
  {
    label: "Excel",
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

const downloadDataAsExcel = (tableData: string[][], fileName: string) => {
  import("xlsx").then((XLSX) => {
    const workSheet = XLSX.utils.aoa_to_sheet(tableData);
    const workBook = {
      Sheets: { data: workSheet, cols: [] },
      SheetNames: ["data"],
    };
    const excelBuffer = XLSX.write(workBook, {
      bookType: "xlsx",
      type: "array",
    });
    const fileData = new Blob([excelBuffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    import("file-saver").then((FileSaver) => {
      FileSaver.saveAs(fileData, `${fileName}.xlsx`);
    });
  });
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
    const tableData: string[][] = [];
    const tableHeaders: string[] = props.columns
      .map((column: ReactTableColumnProps) => {
        if (column.metaProperties && !column.metaProperties.isHidden) {
          return column.Header;
        }
        return "";
      })
      .filter((i) => !!i);
    tableData.push(tableHeaders);
    for (let row = 0; row < props.data.length; row++) {
      const data: { [key: string]: any } = props.data[row];
      const tableRow: string[] = [];
      for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
        const column = props.columns[colIndex];
        if (column.metaProperties && !column.metaProperties.isHidden) {
          tableRow.push(data[column.accessor]);
        }
      }
      tableData.push(tableRow);
    }
    downloadDataAsExcel(tableData, props.widgetName);
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

  if (props.columns.length === 0) {
    return (
      <TableIconWrapper disabled>
        <IconWrapper color={Colors.CADET_BLUE} height={20} width={20}>
          <DownloadIcon />
        </IconWrapper>
      </TableIconWrapper>
    );
  }
  return (
    <Popover
      enforceFocus={false}
      interactionKind={PopoverInteractionKind.CLICK}
      isOpen={selected}
      minimal
      onClose={() => {
        selectMenu(false);
      }}
      position={Position.BOTTOM}
    >
      <TableActionIcon
        className="t--table-download-btn"
        selectMenu={(selected: boolean) => {
          selectMenu(selected);
        }}
        selected={selected}
        tooltip="Download"
      >
        <DownloadIcon />
      </TableActionIcon>
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
