import React, { useState } from "react";
import { MenuItem, Classes, Button as BButton } from "@blueprintjs/core";
import {
  CellWrapper,
  ActionWrapper,
  SortIconWrapper,
} from "./TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";

import {
  ReactTableColumnProps,
  ColumnTypes,
  Condition,
  CellAlignmentTypes,
  VerticalAlignmentTypes,
  FontStyleTypes,
  ColumnProperties,
  CellLayoutProperties,
  TextSizes,
  ConditionFunctions,
  TableStyles,
} from "components/designSystems/appsmith/TableComponent/Constants";
import {
  isString,
  isEmpty,
  findIndex,
  isPlainObject,
  isNil,
  without,
} from "lodash";
import PopoverVideo from "components/designSystems/appsmith/PopoverVideo";
import Button from "components/editorComponents/Button";
import AutoToolTipComponent from "components/designSystems/appsmith/TableComponent/AutoToolTipComponent";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import moment from "moment";
import { DropdownOption } from "widgets/DropdownWidget";
import { IconNames } from "@blueprintjs/icons";
import { Select, IItemRendererProps } from "@blueprintjs/select";

export const renderCell = (
  value: any,
  columnType: string,
  isHidden: boolean,
  cellProperties: CellLayoutProperties,
  tableWidth: number,
) => {
  switch (columnType) {
    case ColumnTypes.IMAGE:
      if (!value) {
        return (
          <CellWrapper
            cellProperties={cellProperties}
            isHidden={isHidden}
          ></CellWrapper>
        );
      } else if (!isString(value)) {
        return (
          <CellWrapper cellProperties={cellProperties} isHidden={isHidden}>
            <div>Invalid Image </div>
          </CellWrapper>
        );
      }
      const imageSplitRegex = /[^(base64)],/;
      const imageUrlRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpeg|jpg|gif|png)??(?:&?[^=&]*=[^=&]*)*/;
      const base64ImageRegex = /^data:image\/.*;base64/;
      return (
        <CellWrapper cellProperties={cellProperties} isHidden={isHidden}>
          {value
            .toString()
            .split(imageSplitRegex)
            .map((item: string, index: number) => {
              if (imageUrlRegex.test(item) || base64ImageRegex.test(item)) {
                return (
                  <a
                    onClick={(e) => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="image-cell-wrapper"
                    href={item}
                    key={index}
                  >
                    <div
                      className="image-cell"
                      style={{ backgroundImage: `url("${item}")` }}
                    />
                  </a>
                );
              } else {
                return <div>Invalid Image</div>;
              }
            })}
        </CellWrapper>
      );
    case ColumnTypes.VIDEO:
      const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/;
      if (!value) {
        return (
          <CellWrapper
            cellProperties={cellProperties}
            isHidden={isHidden}
          ></CellWrapper>
        );
      } else if (isString(value) && youtubeRegex.test(value)) {
        return (
          <CellWrapper
            cellProperties={cellProperties}
            isHidden={isHidden}
            className="video-cell"
          >
            <PopoverVideo url={value} />
          </CellWrapper>
        );
      } else {
        return (
          <CellWrapper cellProperties={cellProperties} isHidden={isHidden}>
            Invalid Video Link
          </CellWrapper>
        );
      }
    default:
      return (
        <AutoToolTipComponent
          title={value.toString()}
          isHidden={isHidden}
          cellProperties={cellProperties}
          tableWidth={tableWidth}
        >
          {value.toString()}
        </AutoToolTipComponent>
      );
  }
};

interface RenderActionProps {
  isSelected: boolean;
  columnActions?: ColumnAction[];
  backgroundColor: string;
  buttonLabelColor: string;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}

export const renderActions = (
  props: RenderActionProps,
  isHidden: boolean,
  cellProperties: CellLayoutProperties,
) => {
  if (!props.columnActions)
    return (
      <CellWrapper
        cellProperties={cellProperties}
        isHidden={isHidden}
      ></CellWrapper>
    );

  return (
    <CellWrapper cellProperties={cellProperties} isHidden={isHidden}>
      {props.columnActions.map((action: ColumnAction, index: number) => {
        return (
          <TableAction
            key={index}
            action={action}
            isSelected={props.isSelected}
            backgroundColor={props.backgroundColor}
            buttonLabelColor={props.buttonLabelColor}
            onCommandClick={props.onCommandClick}
          />
        );
      })}
    </CellWrapper>
  );
};

const TableAction = (props: {
  isSelected: boolean;
  action: ColumnAction;
  backgroundColor: string;
  buttonLabelColor: string;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const onComplete = () => {
    setLoading(false);
  };

  return (
    <ActionWrapper
      background={props.backgroundColor}
      buttonLabelColor={props.buttonLabelColor}
      onClick={(e) => {
        if (props.isSelected) {
          e.stopPropagation();
        }
      }}
    >
      <Button
        intent="PRIMARY_BUTTON"
        loading={loading}
        onClick={() => {
          setLoading(true);
          props.onCommandClick(props.action.dynamicTrigger, onComplete);
        }}
        text={props.action.label}
        filled
        size="small"
      />
    </ActionWrapper>
  );
};

export const renderEmptyRows = (
  rowCount: number,
  columns: any,
  tableWidth: number,
  page: any,
  prepareRow: any,
) => {
  const rows: string[] = new Array(rowCount).fill("");
  if (page.length) {
    const row = page[0];
    return rows.map((item: string, index: number) => {
      prepareRow(row);
      return (
        <div {...row.getRowProps()} className="tr" key={index}>
          {row.cells.map((cell: any, cellIndex: number) => {
            return (
              <div {...cell.getCellProps()} className="td" key={cellIndex} />
            );
          })}
        </div>
      );
    });
  }
  const tableColumns = columns.length
    ? columns
    : new Array(3).fill({ width: tableWidth / 3, isHidden: false });
  return (
    <React.Fragment>
      {rows.map((row: string, index: number) => {
        return (
          <div
            className="tr"
            key={index}
            style={{
              display: "flex",
              flex: "1 0 auto",
            }}
          >
            {tableColumns.map((column: any, colIndex: number) => {
              return (
                <div
                  key={colIndex}
                  className="td"
                  style={{
                    width: column.width + "px",
                    boxSizing: "border-box",
                    flex: `${column.width} 0 auto`,
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </React.Fragment>
  );
};

const AscendingIcon = styled(ControlIcons.SORT_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  top: 18px;
  cursor: pointer;
  transform: rotate(180deg);
  svg {
    path {
      fill: ${(props) => props.theme.colors.secondary};
    }
  }
`;

const DescendingIcon = styled(ControlIcons.SORT_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  top: 3px;
  cursor: pointer;
  svg {
    path {
      fill: ${(props) => props.theme.colors.secondary};
    }
  }
`;

export const TableHeaderCell = (props: {
  columnName: string;
  columnIndex: number;
  isHidden: boolean;
  isAscOrder?: boolean;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  isResizingColumn: boolean;
  column: any;
}) => {
  const { column } = props;
  const handleSortColumn = () => {
    if (props.isResizingColumn) return;
    let columnIndex = props.columnIndex;
    if (props.isAscOrder === true) {
      columnIndex = -1;
    }
    const sortOrder =
      props.isAscOrder === undefined ? false : !props.isAscOrder;
    props.sortTableColumn(columnIndex, sortOrder);
  };

  return (
    <div
      {...column.getHeaderProps()}
      className="th header-reorder"
      onClick={handleSortColumn}
    >
      {props.isAscOrder !== undefined ? (
        <SortIconWrapper>
          {props.isAscOrder ? (
            <AscendingIcon height={16} width={16} />
          ) : (
            <DescendingIcon height={16} width={16} />
          )}
        </SortIconWrapper>
      ) : null}
      <div
        className={
          !props.isHidden
            ? `draggable-header ${
                props.isAscOrder !== undefined ? "sorted" : ""
              }`
            : "hidden-header"
        }
      >
        {column.render("Header")}
      </div>
      <div
        {...column.getResizerProps()}
        className={`resizer ${column.isResizing ? "isResizing" : ""}`}
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    </div>
  );
};

export function sortTableFunction(
  filteredTableData: Array<Record<string, unknown>>,
  columns: ReactTableColumnProps[],
  sortedColumn: string,
  sortOrder: boolean,
) {
  const tableData = filteredTableData ? [...filteredTableData] : [];
  const columnType =
    columns.find(
      (column: ReactTableColumnProps) => column.accessor === sortedColumn,
    )?.metaProperties?.type || ColumnTypes.TEXT;
  return tableData.sort(
    (a: { [key: string]: any }, b: { [key: string]: any }) => {
      if (
        isPlainObject(a) &&
        isPlainObject(b) &&
        !isNil(a[sortedColumn]) &&
        !isNil(b[sortedColumn])
      ) {
        switch (columnType) {
          case ColumnTypes.NUMBER:
            return sortOrder
              ? Number(a[sortedColumn]) > Number(b[sortedColumn])
                ? 1
                : -1
              : Number(b[sortedColumn]) > Number(a[sortedColumn])
              ? 1
              : -1;
          case ColumnTypes.DATE:
            return sortOrder
              ? moment(a[sortedColumn]).isAfter(b[sortedColumn])
                ? 1
                : -1
              : moment(b[sortedColumn]).isAfter(a[sortedColumn])
              ? 1
              : -1;
          default:
            return sortOrder
              ? a[sortedColumn].toString().toUpperCase() >
                b[sortedColumn].toString().toUpperCase()
                ? 1
                : -1
              : b[sortedColumn].toString().toUpperCase() >
                a[sortedColumn].toString().toUpperCase()
              ? 1
              : -1;
        }
      } else {
        return sortOrder ? 1 : 0;
      }
    },
  );
}

export function compare(a: any, b: any, condition: Condition) {
  let result = true;
  try {
    const conditionFunction = ConditionFunctions[condition];
    if (conditionFunction) {
      result = conditionFunction(a, b);
    }
  } catch (e) {
    console.error(e);
  }
  return result;
}

export const reorderColumns = (
  columns: Record<string, ColumnProperties>,
  columnOrder: string[],
) => {
  const newColumnsInOrder: Record<string, ColumnProperties> = {};

  columnOrder.forEach((id: string, index: number) => {
    if (columns[id]) newColumnsInOrder[id] = { ...columns[id], index };
  });
  const remaining = without(
    Object.keys(columns),
    ...Object.keys(newColumnsInOrder),
  );
  const len = Object.keys(newColumnsInOrder).length;
  if (remaining && remaining.length > 0) {
    remaining.forEach((id: string, index: number) => {
      newColumnsInOrder[id] = { ...columns[id], index: len + index };
    });
  }
  return newColumnsInOrder;
};

export function getDefaultColumnProperties(
  accessor: string,
  index: number,
  widgetName: string,
  isDerived?: boolean,
): ColumnProperties {
  const columnProps = {
    index: index,
    width: 150,
    id: accessor,
    horizontalAlignment: CellAlignmentTypes.LEFT,
    verticalAlignment: VerticalAlignmentTypes.CENTER,
    columnType: ColumnTypes.TEXT,
    textColor: Colors.THUNDER,
    textSize: TextSizes.PARAGRAPH,
    fontStyle: FontStyleTypes.REGULAR,
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDerived: !!isDerived,
    label: accessor,
    computedValue: isDerived
      ? ""
      : `{{${widgetName}.sanitizedTableData.map((currentRow) => { return currentRow.${accessor}})}}`,
  };

  return columnProps;
}

export function getTableStyles(props: TableStyles) {
  return {
    textColor: props.textColor,
    textSize: props.textSize,
    fontStyle: props.fontStyle,
    cellBackground: props.cellBackground,
    verticalAlignment: props.verticalAlignment,
    horizontalAlignment: props.horizontalAlignment,
  };
}

const SingleDropDown = Select.ofType<DropdownOption>();

const StyledSingleDropDown = styled(SingleDropDown)`
  div {
    padding: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  span {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    box-shadow: none;
    background: transparent;
    min-height: 32px;
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: ${Colors.SLATE_GRAY};
    }
  }
`;

export const renderDropdown = (props: {
  options: DropdownOption[];
  onItemSelect: (onOptionChange: string, item: DropdownOption) => void;
  onOptionChange: string;
  selectedIndex?: number;
}) => {
  const isOptionSelected = (selectedOption: DropdownOption) => {
    const optionIndex = findIndex(props.options, (option) => {
      return option.value === selectedOption.value;
    });
    return optionIndex === props.selectedIndex;
  };
  const renderSingleSelectItem = (
    option: DropdownOption,
    itemProps: IItemRendererProps,
  ) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    const isSelected: boolean = isOptionSelected(option);
    return (
      <MenuItem
        className="single-select"
        active={isSelected}
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  };
  return (
    <div
      style={{ height: "100%" }}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
      }}
    >
      <StyledSingleDropDown
        items={props.options}
        itemRenderer={renderSingleSelectItem}
        onItemSelect={(item: DropdownOption) => {
          props.onItemSelect(props.onOptionChange, item);
        }}
        popoverProps={{
          minimal: true,
          usePortal: true,
          popoverClassName: "select-popover-wrapper",
        }}
        filterable={false}
      >
        <BButton
          rightIcon={IconNames.CHEVRON_DOWN}
          text={
            !isEmpty(props.options) &&
            props.selectedIndex !== undefined &&
            props.selectedIndex > -1
              ? props.options[props.selectedIndex].label
              : "-- Select --"
          }
        />
      </StyledSingleDropDown>
    </div>
  );
};
