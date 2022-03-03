import React, { useState } from "react";
import {
  MenuItem,
  Classes,
  Button as BButton,
  Alignment,
} from "@blueprintjs/core";
import {
  CellWrapper,
  CellCheckboxWrapper,
  CellCheckbox,
  ActionWrapper,
  DraggableHeaderWrapper,
} from "./TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";

import { ColumnTypes, CellLayoutProperties, MenuItems } from "./Constants";
import { isString, isEmpty, findIndex, isNil, isNaN } from "lodash";
import PopoverVideo from "widgets/VideoWidget/component/PopoverVideo";
import AutoToolTipComponent from "widgets/TableWidget/component/AutoToolTipComponent";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";

import { Colors } from "constants/Colors";
import { DropdownOption } from "widgets/DropdownWidget/constants";
import { IconName, IconNames } from "@blueprintjs/icons";
import { Select, IItemRendererProps } from "@blueprintjs/select";
import { noop } from "utils/AppsmithUtils";

import { ReactComponent as CheckBoxLineIcon } from "assets/icons/widget/table/checkbox-line.svg";
import { ReactComponent as CheckBoxCheckIcon } from "assets/icons/widget/table/checkbox-check.svg";

import {
  ButtonVariant,
  ButtonBoxShadow,
  ButtonBorderRadius,
} from "components/constants";

//TODO(abstraction leak)
import { StyledButton } from "widgets/IconButtonWidget/component";
import MenuButtonTableComponent from "./components/menuButtonTableComponent";
import { stopClickEventPropagation } from "utils/helpers";

interface RenderIconButtonProps {
  isSelected: boolean;
  columnActions?: ColumnAction[];
  iconName?: IconName;
  buttonVariant: ButtonVariant;
  buttonColor: string;
  borderRadius: ButtonBorderRadius;
  boxShadow: ButtonBoxShadow;
  boxShadowColor: string;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  isCellVisible: boolean;
  disabled: boolean;
}
export const renderIconButton = (
  props: RenderIconButtonProps,
  isHidden: boolean,
  cellProperties: CellLayoutProperties,
) => {
  if (!props.columnActions)
    return <CellWrapper cellProperties={cellProperties} isHidden={isHidden} />;

  return (
    <CellWrapper
      cellProperties={cellProperties}
      isCellVisible={props.isCellVisible}
      isHidden={isHidden}
    >
      {props.columnActions.map((action: ColumnAction, index: number) => {
        return (
          <IconButton
            action={action}
            borderRadius={props.borderRadius}
            boxShadow={props.boxShadow}
            boxShadowColor={props.boxShadowColor}
            buttonColor={props.buttonColor}
            buttonVariant={props.buttonVariant}
            disabled={props.disabled}
            iconName={props.iconName}
            isSelected={props.isSelected}
            key={index}
            onCommandClick={props.onCommandClick}
          />
        );
      })}
    </CellWrapper>
  );
};
function IconButton(props: {
  iconName?: IconName;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
  isSelected: boolean;
  action: ColumnAction;
  buttonColor: string;
  buttonVariant: ButtonVariant;
  borderRadius: ButtonBorderRadius;
  boxShadow: ButtonBoxShadow;
  boxShadowColor: string;
  disabled: boolean;
}): JSX.Element {
  const [loading, setLoading] = useState(false);
  const onComplete = () => {
    setLoading(false);
  };
  const handlePropagation = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (props.isSelected) {
      e.stopPropagation();
    }
  };
  const handleClick = () => {
    if (props.action.dynamicTrigger) {
      setLoading(true);
      props.onCommandClick(props.action.dynamicTrigger, onComplete);
    }
  };
  return (
    <div onClick={handlePropagation}>
      <StyledButton
        borderRadius={props.borderRadius}
        boxShadow={props.boxShadow}
        boxShadowColor={props.boxShadowColor}
        buttonColor={props.buttonColor}
        buttonVariant={props.buttonVariant}
        disabled={props.disabled}
        icon={props.iconName}
        loading={loading}
        onClick={handleClick}
      />
    </div>
  );
}

interface RenderActionProps {
  isSelected: boolean;
  columnActions?: ColumnAction[];
  backgroundColor: string;
  buttonLabelColor: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}

export const renderCheckBoxCell = (isChecked: boolean) => (
  <CellCheckboxWrapper
    className="td t--table-multiselect"
    isCellVisible
    isChecked={isChecked}
  >
    <CellCheckbox>
      {isChecked && <CheckBoxCheckIcon className="th-svg" />}
    </CellCheckbox>
  </CellCheckboxWrapper>
);

export const renderCheckBoxHeaderCell = (
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
  checkState: number | null,
) => (
  <CellCheckboxWrapper
    className="th header-reorder t--table-multiselect-header"
    isChecked={!!checkState}
    onClick={onClick}
    role="columnheader"
    style={{ padding: "0px", justifyContent: "center" }}
  >
    <CellCheckbox>
      {checkState === 1 && <CheckBoxCheckIcon className="th-svg" />}
      {checkState === 2 && (
        <CheckBoxLineIcon className="th-svg t--table-multiselect-header-half-check-svg" />
      )}
    </CellCheckbox>
  </CellCheckboxWrapper>
);

export const renderEmptyRows = (
  rowCount: number,
  columns: any,
  tableWidth: number,
  page: any,
  prepareRow: any,
  multiRowSelection = false,
) => {
  const rows: string[] = new Array(rowCount).fill("");
  if (page.length) {
    const row = page[0];
    return rows.map((item: string, index: number) => {
      prepareRow(row);
      const rowProps = {
        ...row.getRowProps(),
        style: { display: "flex" },
      };
      return (
        <div {...rowProps} className="tr" key={index}>
          {multiRowSelection && renderCheckBoxCell(false)}
          {row.cells.map((cell: any, cellIndex: number) => {
            const cellProps = cell.getCellProps();
            if (columns[0]?.columnProperties?.cellBackground) {
              cellProps.style.background =
                columns[0].columnProperties.cellBackground;
            }
            return <div {...cellProps} className="td" key={cellIndex} />;
          })}
        </div>
      );
    });
  } else {
    const tableColumns = columns.length
      ? columns
      : new Array(3).fill({ width: tableWidth / 3, isHidden: false });
    return (
      <>
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
              {multiRowSelection && renderCheckBoxCell(false)}
              {tableColumns.map((column: any, colIndex: number) => {
                return (
                  <div
                    className="td"
                    key={colIndex}
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
      </>
    );
  }
};

const AscendingIcon = styled(ControlIcons.SORT_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  top: 3px;
  cursor: pointer;
  transform: rotate(180deg);
  && svg {
    path {
      fill: ${Colors.LIGHT_GREYISH_BLUE};
    }
  }
`;

const DescendingIcon = styled(ControlIcons.SORT_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  top: 3px;
  cursor: pointer;
  && svg {
    path {
      fill: ${Colors.LIGHT_GREYISH_BLUE};
    }
  }
`;

export function TableHeaderCell(props: {
  columnName: string;
  columnIndex: number;
  isHidden: boolean;
  isAscOrder?: boolean;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  isResizingColumn: boolean;
  column: any;
  editMode?: boolean;
  isSortable?: boolean;
}) {
  const { column, editMode, isSortable } = props;
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
  const disableSort = editMode === false && isSortable === false;

  return (
    <div
      {...column.getHeaderProps()}
      className="th header-reorder"
      onClick={!disableSort && props ? handleSortColumn : undefined}
    >
      <DraggableHeaderWrapper
        className={!props.isHidden ? `draggable-header` : "hidden-header"}
        horizontalAlignment={column.columnProperties.horizontalAlignment}
      >
        {props.columnName}
      </DraggableHeaderWrapper>
      {props.isAscOrder !== undefined ? (
        <div>
          {props.isAscOrder ? (
            <AscendingIcon height={16} width={16} />
          ) : (
            <DescendingIcon height={16} width={16} />
          )}
        </div>
      ) : null}
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
}
