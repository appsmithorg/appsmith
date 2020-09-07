import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import { StyledInputGroup, StyledPropertyPaneButton } from "./StyledControls";
import styled from "constants/DefaultTheme";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import { DroppableComponent } from "../designSystems/appsmith/DraggableListComponent";
import { ColumnTypes } from "widgets/TableWidget";
import { getAllTableColumnKeys } from "components/designSystems/appsmith/TableUtilities";
import _ from "lodash";

const StyledDragIcon = styled(ControlIcons.DRAG_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  margin-right: 15px;
  cursor: move;
  svg {
    path {
      fill: ${props => props.theme.colors.paneSectionLabel};
    }
  }
`;

const ItemWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
`;

const TabsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  margin-right: 2px;
  &&& {
    input {
      border: none;
      color: ${props => props.theme.colors.textOnDarkBG};
      background: ${props => props.theme.colors.paneInputBG};
      &:focus {
        border: none;
        color: ${props => props.theme.colors.textOnDarkBG};
        background: ${props => props.theme.colors.paneInputBG};
      }
    }
  }
`;

const AddColumnButton = styled(StyledPropertyPaneButton)`
  width: 100%;
  margin-top: 8px;
`;

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
  };
  updateOption: (index: number, value: string) => void;
};

function ColumnControlComponent(props: RenderComponentProps) {
  const { updateOption, item, index } = props;
  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        type="text"
        placeholder="Column Title"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          updateOption(index, event.target.value);
        }}
        defaultValue={item.label}
      />
    </ItemWrapper>
  );
}

export interface AppSmithTableColumnProps {
  label: string;
  index: number;
  accessor: string;
  draggable: boolean;
  enableSort: boolean;
  enableFilter: boolean;
  visible: boolean;
  format: string;
  type: string;
  isAscOrder: boolean;
}

class AdditionalColumnsControl extends BaseControl<ControlProps> {
  getTableColumns = () => {
    const columns: AppSmithTableColumnProps[] = [];
    const {
      columnNameMap,
      columnTypeMap,
      sortedColumn,
      tableData,
    } = this.props.widgetProperties;
    const data = _.isString(tableData) ? JSON.parse(tableData) : tableData;
    if (data.length) {
      const columnKeys: string[] = getAllTableColumnKeys(data);
      for (let index = 0; index < columnKeys.length; index++) {
        const i = columnKeys[index];
        const columnName: string =
          columnNameMap && columnNameMap[i] ? columnNameMap[i] : i;
        const columnType: { type: string; format?: string } =
          columnTypeMap && columnTypeMap[i]
            ? columnTypeMap[i]
            : { type: ColumnTypes.TEXT };
        const isHidden =
          !!this.props.widgetProperties.hiddenColumns &&
          this.props.widgetProperties.hiddenColumns.includes(i);
        const columnData = {
          label: columnName,
          accessor: i,
          index: index,
          draggable: true,
          visible: !isHidden,
          isAscOrder:
            sortedColumn && sortedColumn.column === i
              ? sortedColumn.asc
              : undefined,
          type: columnType.type,
          format: columnType.format || "",
          enableSort: true,
          enableFilter: true,
        };
        columns.push(columnData);
      }
      // columns = reorderColumns(columns, columnOrder || []);
    }
    return columns;
  };
  render() {
    const columns: AppSmithTableColumnProps[] = []; //this.getTableColumns();
    return (
      <TabsWrapper>
        <DroppableComponent
          items={columns}
          renderComponent={ColumnControlComponent}
          updateOption={this.updateOption}
          updateItems={this.updateItems}
          deleteOption={this.deleteOption}
        />
        <AddColumnButton
          text="Add a new column"
          icon="plus"
          color="#FFFFFF"
          minimal={true}
          onClick={() => {
            this.props.childrenProperties &&
              this.props.openNextPanel(this.props.childrenProperties);
          }}
        />
      </TabsWrapper>
    );
  }

  updateItems = (items: object[]) => {
    this.updateProperty(this.props.propertyName, JSON.stringify(items));
  };

  deleteOption = (index: number) => {
    const columns = this.getTableColumns();
    columns.splice(index, 1);
    this.updateProperty(this.props.propertyName, JSON.stringify(columns));
  };

  updateOption = (index: number, updatedLabel: string) => {
    const columns = this.getTableColumns();
    const updatedColumns = columns.map(
      (column: AppSmithTableColumnProps, columnIndex: number) => {
        if (columnIndex === index) {
          column.label = updatedLabel;
        }
        return column;
      },
    );
    this.updateProperty(
      this.props.propertyName,
      JSON.stringify(updatedColumns),
    );
  };

  static getControlType() {
    return "ADDITIONAL_COLUMNS";
  }
}

export default AdditionalColumnsControl;
