import React from "react";
import { IconWrapper } from "constants/IconConstants";
import { Tooltip } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { ReactComponent as DownloadIcon } from "assets/icons/control/download-table.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/ReactTableComponent";
import { TableIconWrapper } from "components/designSystems/appsmith/TableStyledWrappers";

interface TableDataDownloadProps {
  data: object[];
  columns: ReactTableColumnProps[];
  widgetName: string;
}

const TableDataDownload = (props: TableDataDownloadProps) => {
  const [selected, toggleButtonClick] = React.useState(false);
  const downloadTableData = () => {
    toggleButtonClick(true);
    const csvData = [];
    csvData.push(
      props.columns
        .map((column: ReactTableColumnProps) => {
          if (column.metaProperties && !column.metaProperties.isHidden) {
            return column.Header;
          }
        })
        .filter(i => !!i),
    );
    for (let row = 0; row < props.data.length; row++) {
      const data: { [key: string]: any } = props.data[row];
      const csvDataRow = [];
      for (let colIndex = 0; colIndex < props.columns.length; colIndex++) {
        const column = props.columns[colIndex];
        const value = data[column.accessor];
        if (column.metaProperties && !column.metaProperties.isHidden) {
          csvDataRow.push(value);
        }
      }
      csvData.push(csvDataRow);
    }
    let csvContent = "";
    csvData.forEach(function(infoArray, index) {
      const dataString = infoArray.join(",");
      csvContent += index < csvData.length ? dataString + "\n" : dataString;
    });
    const fileName = `${props.widgetName}.csv`;
    const anchor = document.createElement("a");
    const mimeType = "application/octet-stream";
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(
        new Blob([csvContent], {
          type: mimeType,
        }),
        fileName,
      );
    } else if (URL && "download" in anchor) {
      anchor.href = URL.createObjectURL(
        new Blob([csvContent], {
          type: mimeType,
        }),
      );
      anchor.setAttribute("download", fileName);
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    }
    toggleButtonClick(false);
  };

  return (
    <TableIconWrapper
      onClick={() => {
        downloadTableData();
      }}
    >
      <Tooltip
        autoFocus={false}
        hoverOpenDelay={1000}
        content="Download"
        position="top"
      >
        <IconWrapper
          width={20}
          height={20}
          color={selected ? Colors.OXFORD_BLUE : Colors.CADET_BLUE}
        >
          <DownloadIcon />
        </IconWrapper>
      </Tooltip>
    </TableIconWrapper>
  );
};

export default TableDataDownload;
