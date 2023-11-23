import React, { memo } from "react";
import type { ReactTableColumnProps } from "../../Constants";
import { transformTableDataIntoCsv } from "./Utilities";
import zipcelx from "zipcelx";
import { importSvg } from "design-system-old";
import { Menu, MenuList, Item, Button } from "@design-system/widgets";

const DownloadIcon = importSvg(
  async () => import("assets/icons/control/download-data-icon.svg"),
);

interface TableDataDownloadProps {
  data: Array<Record<string, unknown>>;
  columns: ReactTableColumnProps[];
  widgetName: string;
  delimiter: string;
  borderRadius?: string;
}

type FileDownloadType = "CSV" | "EXCEL";

interface DataCellProps {
  value: string | number;
  type: "string" | "number";
}

interface DownloadOptionProps {
  label: string;
  key: FileDownloadType;
}

const downloadOptions: DownloadOptionProps[] = [
  {
    label: "Download as CSV",
    key: "CSV",
  },
  {
    label: "Download as Excel",
    key: "EXCEL",
  },
];

const downloadDataAsCSV = (props: {
  csvData: Array<Array<any>>;
  delimiter: string;
  fileName: string;
}) => {
  let csvContent = "";
  props.csvData.forEach((infoArray: Array<any>, index: number) => {
    const dataString = infoArray.join(props.delimiter);
    csvContent += index < props.csvData.length ? dataString + "\n" : dataString;
  });
  const anchor = document.createElement("a");
  const mimeType = "application/octet-stream";
  // @ts-expect-error: msSaveBlob does not exists on navigator
  if (navigator.msSaveBlob) {
    // @ts-expect-error: msSaveBlob does not exists on navigator
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
  const downloadFile = (type: FileDownloadType) => {
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
            value: data[column.alias],
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
    const csvData = transformTableDataIntoCsv({
      columns: props.columns,
      data: props.data,
    });
    downloadDataAsCSV({
      csvData: csvData,
      delimiter: props.delimiter,
      fileName: `${props.widgetName}.csv`,
    });
  };

  return (
    <Menu
      items={downloadOptions}
      onAction={(key) => downloadFile(key as FileDownloadType)}
    >
      <Button
        icon={DownloadIcon}
        isDisabled={props.columns.length === 0}
        variant="ghost"
      >
        Download
      </Button>
      <MenuList>
        {(item: DownloadOptionProps) => (
          <Item key={item.key}>{item.label}</Item>
        )}
      </MenuList>
    </Menu>
  );
}

export default memo(TableDataDownload);
