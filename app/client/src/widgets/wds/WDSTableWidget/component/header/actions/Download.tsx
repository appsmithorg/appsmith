import React, { memo } from "react";
import { Classes } from "@blueprintjs/core";
import { IconWrapper } from "constants/IconConstants";
import { Colors } from "constants/Colors";
import type { ReactTableColumnProps } from "../../Constants";
import { TableIconWrapper } from "../../TableStyledWrappers";
import styled from "styled-components";
import { ActionItem } from "./ActionItem";
import { transformTableDataIntoCsv } from "./Utilities";
import zipcelx from "zipcelx";
import { importSvg } from "design-system-old";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@design-system/headless";

const DownloadIcon = importSvg(
  async () => import("assets/icons/control/download-data-icon.svg"),
);

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
  color: var(--wds-color-text);
  min-width: 200px;
  cursor: pointer;
  background: var(--wds-color-bg);
  border-left: none;
  border-radius: unset;
  .option-title {
    font-weight: 500;
    font-size: 13px;
    line-height: 20px;
  }
  &:hover {
    background: var(--wds-color-bg-hover);
  }
`;

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
  const [selected, selectMenu] = React.useState(false);

  const downloadFile = (type: string) => {
    if (type === "CSV") {
      downloadTableDataAsCsv();
    } else if (type === "EXCEL") {
      downloadTableDataAsExcel();
    }
    selectMenu(false);
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
    selectMenu(false);
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
    <Popover onOpenChange={selectMenu} open={selected}>
      <PopoverTrigger asChild>
        <ActionItem
          icon="download"
          onPress={() => selectMenu(!selected)}
          title="Download"
        />
      </PopoverTrigger>
      <PopoverContent>
        <div>
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default memo(TableDataDownload);
