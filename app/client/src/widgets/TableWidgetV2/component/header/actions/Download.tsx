import { importSvg } from "@appsmith/ads-old";
import {
  Classes,
  Popover,
  PopoverInteractionKind,
  Position,
} from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { IconWrapper } from "constants/IconConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import React, { memo } from "react";
import styled, { createGlobalStyle } from "styled-components";
import AppsmithConsole from "utils/AppsmithConsole";
import type { ReactTableColumnProps } from "../../Constants";
import { TableIconWrapper } from "../../TableStyledWrappers";
import ActionItem from "./ActionItem";
import { transformTableDataIntoCsv } from "./Utilities";

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
  border-radius: none;
  .option-title {
    font-weight: 500;
    font-size: 13px;
    line-height: 20px;
  }
  &:hover {
    background: var(--wds-color-bg-hover);
  }
`;

const PopoverStyles = createGlobalStyle<{
  id?: string;
  borderRadius?: string;
}>`
  ${({ borderRadius, id }) => `
    .${id}.${Classes.POPOVER} {
      border-radius: min(${borderRadius}, 0.375rem);
      box-shadow: 0 6px 20px 0px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    }
  `}
`;

interface TableDataDownloadProps {
  data: Array<Record<string, unknown>>;
  columns: ReactTableColumnProps[];
  widgetName: string;
  delimiter: string;
  borderRadius?: string;
  widgetId: string;
}

type FileDownloadType = "CSV" | "EXCEL";

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
  csvData: Array<Array<unknown>>;
  delimiter: string;
  fileName: string;
}) => {
  let csvContent = "";

  props.csvData.forEach((infoArray: Array<unknown>, index: number) => {
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
  };
  const downloadTableDataAsExcel = async () => {
    try {
      // Dynamically import xlsx only when needed
      const XLSX = await import("xlsx");
      const tableData: Array<Array<unknown>> = [];

      const headers = props.columns
        .filter((column: ReactTableColumnProps) => {
          return column.metaProperties && !column.metaProperties.isHidden;
        })
        .map((column: ReactTableColumnProps) => column.Header);

      tableData.push(headers);

      for (let row = 0; row < props.data.length; row++) {
        const data = props.data[row];
        const tableRow: Array<unknown> = [];

        props.columns.forEach((column) => {
          if (column.metaProperties && !column.metaProperties.isHidden) {
            const value = data[column.alias];

            if (
              column.columnProperties?.columnType === "number" &&
              typeof value === "string"
            ) {
              tableRow.push(Number(value) || 0);
            } else {
              tableRow.push(value);
            }
          }
        });

        tableData.push(tableRow);
      }

      // Create workbook and worksheet using the dynamically imported XLSX
      const ws = XLSX.utils.aoa_to_sheet(tableData);
      const wb = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

      // Generate and download file
      XLSX.writeFile(wb, `${props.widgetName}.xlsx`);
    } catch (error) {
      AppsmithConsole.error({
        text: `Error loading Excel export functionality: ${error}`,
        source: {
          id: props.widgetId,
          name: props.widgetName,
          type: ENTITY_TYPE.WIDGET,
        },
      });
    }
  };

  const downloadTableDataAsCsv = () => {
    selectMenu(true);
    const csvData = transformTableDataIntoCsv({
      columns: props.columns,
      data: props.data,
    });

    downloadDataAsCSV({
      csvData: csvData,
      delimiter: props.delimiter,
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
    <>
      <Popover
        enforceFocus={false}
        interactionKind={PopoverInteractionKind.CLICK}
        isOpen={selected}
        minimal
        onClose={handleCloseMenu}
        popoverClassName="table-download-popover"
        position={Position.BOTTOM}
      >
        <ActionItem
          borderRadius={props.borderRadius}
          className="t--table-download-btn"
          icon="download"
          selectMenu={selectMenu}
          selected={selected}
          title="Download"
          width={16}
        />
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
      <PopoverStyles
        borderRadius={props.borderRadius}
        id="table-download-popover"
      />
    </>
  );
}

export default memo(TableDataDownload);
