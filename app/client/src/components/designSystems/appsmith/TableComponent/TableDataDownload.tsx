import React from "react";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import { ReactComponent as DownloadIcon } from "assets/icons/control/download-table.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/TableComponent/Constants";
import { TableIconWrapper } from "components/designSystems/appsmith/TableComponent/TableStyledWrappers";
import TableActionIcon from "components/designSystems/appsmith/TableComponent/TableActionIcon";
import { transformTableDataIntoCsv } from "./CommonUtilities";

interface TableDataDownloadProps {
  data: Array<Record<string, unknown>>;
  columns: ReactTableColumnProps[];
  widgetName: string;
}

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
  const [selected, toggleButtonClick] = React.useState(false);
  const downloadTableData = () => {
    toggleButtonClick(true);
    const csvData = transformTableDataIntoCsv({
      columns: props.columns,
      data: props.data,
    });
    downloadDataAsCSV({
      csvData: csvData,
      fileName: `${props.widgetName}.csv`,
    });
    toggleButtonClick(false);
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
    <TableActionIcon
      className="t--table-download-btn"
      selectMenu={() => {
        downloadTableData();
      }}
      selected={selected}
      tooltip="Download"
    >
      <DownloadIcon />
    </TableActionIcon>
  );
}

export default TableDataDownload;
