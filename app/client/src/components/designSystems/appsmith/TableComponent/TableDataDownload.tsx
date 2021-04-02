import React from "react";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import { ReactComponent as DownloadIcon } from "assets/icons/control/download-table.svg";
import { ReactTableColumnProps } from "components/designSystems/appsmith/TableComponent/Constants";
import { TableIconWrapper } from "components/designSystems/appsmith/TableComponent/TableStyledWrappers";
import TableActionIcon from "components/designSystems/appsmith/TableComponent/TableActionIcon";
import {
  downloadTableDataAsCSV,
  transformTableDataIntoCsv,
} from "./CommonUtilities";

interface TableDataDownloadProps {
  data: Array<Record<string, unknown>>;
  columns: ReactTableColumnProps[];
  widgetName: string;
}

const TableDataDownload = (props: TableDataDownloadProps) => {
  const [selected, toggleButtonClick] = React.useState(false);
  const downloadTableData = () => {
    toggleButtonClick(true);
    const csvData = transformTableDataIntoCsv({
      columns: props.columns,
      data: props.data,
    });
    downloadTableDataAsCSV({
      csvData: csvData,
      fileName: `${props.widgetName}.csv`,
    });
    toggleButtonClick(false);
  };

  if (props.columns.length === 0) {
    return (
      <TableIconWrapper disabled>
        <IconWrapper width={20} height={20} color={Colors.CADET_BLUE}>
          <DownloadIcon />
        </IconWrapper>
      </TableIconWrapper>
    );
  }
  return (
    <TableActionIcon
      tooltip="Download"
      selected={selected}
      selectMenu={() => {
        downloadTableData();
      }}
      className="t--table-download-btn"
    >
      <DownloadIcon />
    </TableActionIcon>
  );
};

export default TableDataDownload;
