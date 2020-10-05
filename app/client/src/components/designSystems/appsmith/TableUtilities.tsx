import React, { useState } from "react";
import { Icon, InputGroup, Tag } from "@blueprintjs/core";
import {
  MenuColumnWrapper,
  CellWrapper,
  ActionWrapper,
  SortIconWrapper,
  MenuCategoryWrapper,
} from "./TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";
import { ColumnMenuOptionProps } from "components/designSystems/appsmith/ReactTableComponent";
import {
  ReactTableColumnProps,
  ColumnTypes,
  Condition,
} from "widgets/TableWidget";
import { isString } from "lodash";
import PopoverVideo from "components/designSystems/appsmith/PopoverVideo";
import Button from "components/editorComponents/Button";
import AutoToolTipComponent from "components/designSystems/appsmith/AutoToolTipComponent";
import TableColumnMenuPopup from "./TableColumnMenu";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import moment from "moment";

interface MenuOptionProps {
  columnAccessor?: string;
  isColumnHidden: boolean;
  columnType: string;
  format?: string;
  inputFormat?: string;
  hideColumn: (columnIndex: number, isColumnHidden: boolean) => void;
  updateColumnType: (columnIndex: number, columnType: string) => void;
  handleUpdateCurrencySymbol: (
    columnIndex: number,
    currencySymbol: string,
  ) => void;
  handleDateFormatUpdate: (
    columnIndex: number,
    dateFormat: string,
    dateInputFormat?: string,
  ) => void;
}

export const getMenuOptions = (props: MenuOptionProps) => {
  const basicOptions: ColumnMenuOptionProps[] = [
    {
      content: "Rename a Column",
      closeOnClick: true,
      id: "rename_column",
      editColumnName: true,
    },
    {
      content: props.isColumnHidden ? "Show Column" : "Hide Column",
      closeOnClick: true,
      id: "hide_column",
      onClick: (columnIndex: number) => {
        props.hideColumn(columnIndex, props.isColumnHidden);
      },
    },
  ];
  if (props.columnAccessor && props.columnAccessor === "actions") {
    return basicOptions;
  }
  const columnMenuOptions: ColumnMenuOptionProps[] = [
    ...basicOptions,
    {
      content: "Select a Data Type",
      id: "change_column_type",
      category: true,
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === ColumnTypes.IMAGE}>
          <Icon
            icon="media"
            iconSize={12}
            color={
              props.columnType === ColumnTypes.IMAGE
                ? Colors.WHITE
                : Colors.OXFORD_BLUE
            }
          />
          <div className="title">Image</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === ColumnTypes.IMAGE,
      onClick: (columnIndex: number, isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType(columnIndex, "");
        } else {
          props.updateColumnType(columnIndex, ColumnTypes.IMAGE);
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === ColumnTypes.VIDEO}>
          <Icon
            icon="video"
            iconSize={12}
            color={
              props.columnType === ColumnTypes.VIDEO
                ? Colors.WHITE
                : Colors.OXFORD_BLUE
            }
          />
          <div className="title">Video</div>
        </MenuColumnWrapper>
      ),
      isSelected: props.columnType === ColumnTypes.VIDEO,
      closeOnClick: true,
      onClick: (columnIndex: number, isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType(columnIndex, "");
        } else {
          props.updateColumnType(columnIndex, ColumnTypes.VIDEO);
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === ColumnTypes.TEXT}>
          <Icon
            icon="label"
            iconSize={12}
            color={
              props.columnType === ColumnTypes.TEXT
                ? Colors.WHITE
                : Colors.OXFORD_BLUE
            }
          />
          <div className="title">Text</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === ColumnTypes.TEXT,
      onClick: (columnIndex: number, isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType(columnIndex, "");
        } else {
          props.updateColumnType(columnIndex, ColumnTypes.TEXT);
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === ColumnTypes.CURRENCY}>
          <Icon
            icon="dollar"
            iconSize={12}
            color={
              props.columnType === ColumnTypes.CURRENCY
                ? Colors.WHITE
                : Colors.OXFORD_BLUE
            }
          />
          <div className="title">Currency</div>
          <Icon
            className="sub-menu"
            icon="chevron-right"
            iconSize={16}
            color={
              props.columnType === ColumnTypes.CURRENCY
                ? Colors.WHITE
                : Colors.OXFORD_BLUE
            }
          />
        </MenuColumnWrapper>
      ),
      closeOnClick: false,
      isSelected: props.columnType === ColumnTypes.CURRENCY,
      options: [
        {
          content: "USD - $",
          isSelected: props.format === "$",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "$");
          },
        },
        {
          content: "INR - ₹",
          isSelected: props.format === "₹",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "₹");
          },
        },
        {
          content: "GBP - £",
          isSelected: props.format === "£",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "£");
          },
        },
        {
          content: "AUD - A$",
          isSelected: props.format === "A$",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "A$");
          },
        },
        {
          content: "EUR - €",
          isSelected: props.format === "€",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "€");
          },
        },
        {
          content: "SGD - S$",
          isSelected: props.format === "S$",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "S$");
          },
        },
        {
          content: "CAD - C$",
          isSelected: props.format === "C$",
          closeOnClick: true,
          onClick: (columnIndex: number) => {
            props.handleUpdateCurrencySymbol(columnIndex, "C$");
          },
        },
      ],
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === ColumnTypes.DATE}>
          <Icon
            icon="calendar"
            iconSize={12}
            color={
              props.columnType === ColumnTypes.DATE
                ? Colors.WHITE
                : Colors.OXFORD_BLUE
            }
          />
          <div className="title">Date</div>
          <Icon
            className="sub-menu"
            icon="chevron-right"
            iconSize={16}
            color={
              props.columnType === ColumnTypes.DATE
                ? Colors.WHITE
                : Colors.OXFORD_BLUE
            }
          />
        </MenuColumnWrapper>
      ),
      closeOnClick: false,
      isSelected: props.columnType === ColumnTypes.DATE,
      options: [
        {
          content: (
            <MenuCategoryWrapper>
              <div>Date Input Format</div>
              {props.inputFormat && <Tag>Clear</Tag>}
            </MenuCategoryWrapper>
          ),
          category: true,
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.updateColumnType(columnIndex, ColumnTypes.TEXT);
          },
          id: "date_input",
        },
        {
          content: "UNIX timestamp (s)",
          isSelected: props.inputFormat === "Epoch",
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              props.format || "",
              "Epoch",
            );
          },
        },
        {
          content: "UNIX timestamp (ms)",
          isSelected: props.inputFormat === "Milliseconds",
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              props.format || "",
              "Milliseconds",
            );
          },
        },
        {
          content: "YYYY-MM-DD",
          isSelected: props.inputFormat === "YYYY-MM-DD",
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              props.format || "",
              "YYYY-MM-DD",
            );
          },
        },
        {
          content: "YYYY-MM-DDTHH:mm:ss",
          isSelected: props.inputFormat === "YYYY-MM-DDTHH:mm:ss",
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              props.format || "",
              "YYYY-MM-DDTHH:mm:ss",
            );
          },
        },
        {
          content: "YYYY-MM-DD hh:mm:ss",
          isSelected: props.inputFormat === "YYYY-MM-DD hh:mm:ss",
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              props.format || "",
              "YYYY-MM-DD hh:mm:ss",
            );
          },
        },
        {
          content: (
            <MenuCategoryWrapper>
              <div>Date Output Format</div>
            </MenuCategoryWrapper>
          ),
          closeOnClick: false,
          category: true,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              "",
              props.inputFormat || "",
            );
          },
        },
        {
          content: "Same as Input",
          isSelected: props.format === "SAME_AS_INPUT",
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              "SAME_AS_INPUT",
              props.inputFormat || "",
            );
          },
        },
        {
          content: "DD-MM-YYYY HH:mm",
          isSelected: props.format === "DD-MM-YYYY HH:mm",
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              "DD-MM-YYYY HH:mm",
              props.inputFormat || "",
            );
          },
        },
        {
          content: "DD-MM-YYYY",
          isSelected: props.format === "DD-MM-YYYY",
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              "DD-MM-YYYY",
              props.inputFormat || "",
            );
          },
        },
        {
          content: "Do MMM YYYY",
          isSelected: props.format === "Do MMM YYYY",
          closeOnClick: false,
          onClick: (columnIndex: number) => {
            props.handleDateFormatUpdate(
              columnIndex,
              "Do MMM YYYY",
              props.inputFormat || "",
            );
          },
        },
      ],
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === ColumnTypes.TIME}>
          <Icon
            icon="time"
            iconSize={12}
            color={
              props.columnType === ColumnTypes.TIME
                ? Colors.WHITE
                : Colors.OXFORD_BLUE
            }
          />
          <div className="title">Time</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === ColumnTypes.TIME,
      onClick: (columnIndex: number, isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType(columnIndex, "");
        } else {
          props.updateColumnType(columnIndex, ColumnTypes.TIME);
        }
      },
    },
    {
      content: (
        <MenuColumnWrapper selected={props.columnType === ColumnTypes.NUMBER}>
          <Icon
            icon="numerical"
            iconSize={12}
            color={
              props.columnType === ColumnTypes.NUMBER
                ? Colors.WHITE
                : Colors.OXFORD_BLUE
            }
          />
          <div className="title">Number</div>
        </MenuColumnWrapper>
      ),
      closeOnClick: true,
      isSelected: props.columnType === ColumnTypes.NUMBER,
      onClick: (columnIndex: number, isSelected: boolean) => {
        if (isSelected) {
          props.updateColumnType(columnIndex, "");
        } else {
          props.updateColumnType(columnIndex, ColumnTypes.NUMBER);
        }
      },
    },
  ];
  return columnMenuOptions;
};

export const renderCell = (
  value: any,
  columnType: string,
  isHidden: boolean,
) => {
  switch (columnType) {
    case ColumnTypes.IMAGE:
      if (!value) {
        return <CellWrapper isHidden={isHidden}></CellWrapper>;
      } else if (!isString(value)) {
        return (
          <CellWrapper isHidden={isHidden}>
            <div>Invalid Image </div>
          </CellWrapper>
        );
      }
      const imageRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpeg|jpg|gif|png)??(?:&?[^=&]*=[^=&]*)*/;
      return (
        <CellWrapper isHidden={isHidden}>
          {value
            .toString()
            .split(",")
            .map((item: string, index: number) => {
              if (imageRegex.test(item)) {
                return (
                  <a
                    onClick={e => e.stopPropagation()}
                    target="_blank"
                    rel="noopener noreferrer"
                    href={item}
                  >
                    <div
                      key={index}
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
        return <CellWrapper isHidden={isHidden}></CellWrapper>;
      } else if (isString(value) && youtubeRegex.test(value)) {
        return (
          <CellWrapper isHidden={isHidden} className="video-cell">
            <PopoverVideo url={value} />
          </CellWrapper>
        );
      } else {
        return (
          <CellWrapper isHidden={isHidden}>Invalid Video Link</CellWrapper>
        );
      }
    default:
      return (
        <AutoToolTipComponent title={value.toString()} isHidden={isHidden}>
          {value.toString()}
        </AutoToolTipComponent>
      );
  }
};

interface RenderActionProps {
  isSelected: boolean;
  columnActions?: ColumnAction[];
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}

export const renderActions = (props: RenderActionProps) => {
  if (!props.columnActions) return <CellWrapper isHidden={false}></CellWrapper>;
  return (
    <CellWrapper isHidden={false}>
      {props.columnActions.map((action: ColumnAction, index: number) => {
        return (
          <TableAction
            key={index}
            action={action}
            isSelected={props.isSelected}
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
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const onComplete = () => {
    setLoading(false);
  };
  return (
    <ActionWrapper
      onClick={e => {
        if (props.isSelected) {
          e.stopPropagation();
        }
      }}
    >
      <Button
        loading={loading}
        onClick={() => {
          setLoading(true);
          props.onCommandClick(props.action.dynamicTrigger, onComplete);
        }}
        text={props.action.label}
        intent="primary"
        filled
        size="small"
      />
    </ActionWrapper>
  );
};

const RenameColumn = (props: {
  value: any;
  columnIndex: number;
  handleSave: (columnIndex: number, value: any) => void;
}) => {
  const [columnName, updateColumnName] = useState(props.value);
  const onKeyPress = (key: string) => {
    if (key === "Enter") {
      props.handleSave(props.columnIndex, columnName);
    }
  };
  const onColumnNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateColumnName(event.target.value);
  };
  const handleColumnNameUpdate = () => {
    props.handleSave(props.columnIndex, columnName);
  };
  return (
    <InputGroup
      autoFocus
      type="text"
      className="input-group"
      placeholder="Enter Column Name"
      defaultValue={columnName}
      onChange={onColumnNameChange}
      onKeyPress={e => onKeyPress(e.key)}
      onBlur={e => handleColumnNameUpdate()}
    />
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

const SortIcon = styled(ControlIcons.SORT_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  top: 3px;
  cursor: pointer;
  svg {
    path {
      fill: ${props => props.theme.colors.secondary};
    }
  }
`;

export const TableHeaderCell = (props: {
  columnName: string;
  columnIndex: number;
  isHidden: boolean;
  isAscOrder?: boolean;
  editMode: boolean;
  handleColumnNameUpdate: (columnIndex: number, name: string) => void;
  getColumnMenu: (columnIndex: number) => ColumnMenuOptionProps[];
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  handleResizeColumn: Function;
  column: any;
}) => {
  const { column } = props;
  const [renameColumn, toggleRenameColumn] = React.useState(false);
  const handleSaveColumnName = (columnIndex: number, columName: string) => {
    props.handleColumnNameUpdate(columnIndex, columName);
    toggleRenameColumn(false);
  };
  const handleSortColumn = () => {
    let columnIndex = props.columnIndex;
    if (props.isAscOrder === true) {
      columnIndex = -1;
    }
    const sortOrder =
      props.isAscOrder === undefined ? false : !props.isAscOrder;
    props.sortTableColumn(columnIndex, sortOrder);
  };
  if (column.isResizing) {
    props.handleResizeColumn(
      props.columnIndex,
      column.getHeaderProps().style.width,
    );
  }
  return (
    <div
      {...column.getHeaderProps()}
      className="th header-reorder"
      onClick={handleSortColumn}
    >
      {props.isAscOrder !== undefined ? (
        <SortIconWrapper rotate={props.isAscOrder.toString()}>
          <SortIcon height={16} width={16} />
        </SortIconWrapper>
      ) : null}
      {renameColumn && (
        <RenameColumn
          value={props.columnName}
          handleSave={handleSaveColumnName}
          columnIndex={props.columnIndex}
        />
      )}
      {!renameColumn && (
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
      )}
      {props.editMode && (
        <div
          className="column-menu"
          onClick={(event: React.MouseEvent<HTMLElement>) => {
            event.stopPropagation();
          }}
        >
          <TableColumnMenuPopup
            getColumnMenu={props.getColumnMenu}
            columnIndex={props.columnIndex}
            editColumnName={() => toggleRenameColumn(true)}
          />
        </div>
      )}
      <div
        {...column.getResizerProps()}
        className={`resizer ${column.isResizing ? "isResizing" : ""}`}
      />
    </div>
  );
};

export const getAllTableColumnKeys = (tableData: object[]) => {
  const columnKeys: string[] = [];
  for (let i = 0, tableRowCount = tableData.length; i < tableRowCount; i++) {
    const row = tableData[i];
    for (const key in row) {
      if (!columnKeys.includes(key)) {
        columnKeys.push(key);
      }
    }
  }
  return columnKeys;
};

export const reorderColumns = (
  columns: ReactTableColumnProps[],
  columnOrder: string[],
) => {
  const reorderedColumns = [];
  const reorderedFlagMap: { [key: string]: boolean } = {};
  for (let index = 0; index < columns.length; index++) {
    const accessor = columnOrder[index];
    if (accessor) {
      const column = columns.filter((col: ReactTableColumnProps) => {
        return col.accessor === accessor;
      });
      if (column.length && !reorderedFlagMap[column[0].accessor]) {
        reorderedColumns.push(column[0]);
        reorderedFlagMap[column[0].accessor] = true;
      } else if (!reorderedFlagMap[columns[index].accessor]) {
        reorderedColumns.push(columns[index]);
        reorderedFlagMap[columns[index].accessor] = true;
      }
    } else if (!reorderedFlagMap[columns[index].accessor]) {
      reorderedColumns.push(columns[index]);
      reorderedFlagMap[columns[index].accessor] = true;
    }
  }
  if (reorderedColumns.length < columns.length) {
    for (let index = 0; index < columns.length; index++) {
      if (!reorderedFlagMap[columns[index].accessor]) {
        reorderedColumns.push(columns[index]);
        reorderedFlagMap[columns[index].accessor] = true;
      }
    }
  }
  return reorderedColumns;
};

export function sortTableFunction(
  filteredTableData: object[],
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
        a[sortedColumn] !== undefined &&
        a[sortedColumn] !== null &&
        b[sortedColumn] !== undefined &&
        b[sortedColumn] !== null
      ) {
        switch (columnType) {
          case ColumnTypes.CURRENCY:
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

export const ConditionFunctions: {
  [key: string]: (a: any, b: any) => boolean;
} = {
  isExactly: (a: any, b: any) => {
    return a === b;
  },
  empty: (a: any) => {
    return a === "" || a === undefined || a === null;
  },
  notEmpty: (a: any) => {
    return a !== "" && a !== undefined && a !== null;
  },
  notEqualTo: (a: any, b: any) => {
    return a !== b;
  },
  lessThan: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA < numericB;
  },
  lessThanEqualTo: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA <= numericB;
  },
  greaterThan: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA > numericB;
  },
  greaterThanEqualTo: (a: any, b: any) => {
    const numericB = Number(b);
    const numericA = Number(a);
    return numericA >= numericB;
  },
  contains: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.includes(b);
    }
    return false;
  },
  doesNotContain: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return !a.includes(b);
    }
    return false;
  },
  startsWith: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.indexOf(b) === 0;
    }
    return false;
  },
  endsWith: (a: any, b: any) => {
    if (isString(a) && isString(b)) {
      return a.length === a.indexOf(b) + b.length;
    }
    return false;
  },
  is: (a: any, b: any) => {
    return moment(a).isSame(moment(b), "d");
  },
  isNot: (a: any, b: any) => {
    return !moment(a).isSame(moment(b), "d");
  },
  isAfter: (a: any, b: any) => {
    return !moment(a).isAfter(moment(b), "d");
  },
  isBefore: (a: any, b: any) => {
    return !moment(a).isBefore(moment(b), "d");
  },
};

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
