import React from "react";
import { IconWrapper } from "constants/IconConstants";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ReactComponent as DownloadIcon } from "assets/icons/control/download-table.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/ReactTableComponent";
import moment from "moment";

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
interface TableDataDownloadProps {
  data: object[];
  columns: ReactTableColumnProps[];
  widgetId: string;
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
        if (column.metaProperties) {
          const type = column.metaProperties.type;
          const format = column.metaProperties.format;
          switch (type) {
            case "currency":
              if (!isNaN(value)) {
                csvDataRow.push(`${format}${value ? value : ""}`);
              } else {
                csvDataRow.push("Invalid Value");
              }
              break;
            case "date":
              let isValidDate = true;
              if (isNaN(value)) {
                const dateTime = Date.parse(value);
                if (isNaN(dateTime)) {
                  isValidDate = false;
                }
              }
              if (isValidDate) {
                csvDataRow.push(moment(value).format(format));
              } else {
                csvDataRow.push("Invalid Value");
              }
              break;
            case "time":
              let isValidTime = true;
              if (isNaN(value)) {
                const time = Date.parse(value);
                if (isNaN(time)) {
                  isValidTime = false;
                }
              }
              if (isValidTime) {
                csvDataRow.push(moment(value).format("HH:mm"));
              } else {
                csvDataRow.push("Invalid Value");
              }
              break;
            default:
              csvDataRow.push(value ? value : "");
              break;
          }
        }
      }
      csvData.push(csvDataRow);
    }
    let csvContent = "";
    csvData.forEach(function(infoArray, index) {
      const dataString = infoArray.join(";");
      csvContent += index < csvData.length ? dataString + "\n" : dataString;
    });
    const fileName = `table-${props.widgetId}.csv`;
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
      selected={false}
      onClick={() => {
        downloadTableData();
      }}
    >
      <IconWrapper
        width={20}
        height={20}
        color={selected ? Colors.OXFORD_BLUE : Colors.CADET_BLUE}
      >
        <DownloadIcon />
      </IconWrapper>
    </TableIconWrapper>
  );
};

export default TableDataDownload;
