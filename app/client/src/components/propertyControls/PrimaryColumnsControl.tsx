import React, { useState } from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledInputGroup,
  StyledDragIcon,
  StyledEditIcon,
  StyledDeleteIcon,
  StyledVisibleIcon,
  StyledHiddenIcon,
  StyledPropertyPaneButton,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { DroppableComponent } from "components/designSystems/appsmith/DraggableListComponent";
import { ColumnProperties } from "components/designSystems/appsmith/TableComponent/Constants";
import EmptyDataState from "components/utils/EmptyDataState";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  getDefaultColumnProperties,
  reorderColumns,
  getTableStyles,
} from "components/designSystems/appsmith/TableComponent/TableUtilities";
import { debounce } from "lodash";

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
  width: 100%;
  &&& {
    input {
      padding-left: 24px;
      border: none;
      color: ${(props) => props.theme.colors.textOnDarkBG};
      background: ${(props) => props.theme.colors.paneInputBG};
      &:focus {
        border: none;
        color: ${(props) => props.theme.colors.textOnDarkBG};
        background: ${(props) => props.theme.colors.paneInputBG};
      }
    }
  }
`;

const AddColumnButton = styled(StyledPropertyPaneButton)`
  width: 100%;
  &&&& {
    margin-top: 12px;
    margin-bottom: 8px;
  }
`;

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
    isDerived?: boolean;
    isVisible?: boolean;
  };
  updateOption: (index: number, value: string) => void;
  onEdit?: (index: number) => void;
  deleteOption: (index: number) => void;
  toggleVisibility?: (index: number) => void;
};

const getOriginalColumnIndex = (
  columns: ColumnProperties[],
  index: number,
  columnOrder?: string[],
) => {
  let originalColumnIndex = index;
  if (columnOrder) {
    const columnId = columnOrder ? columnOrder[index] : "";
    originalColumnIndex = columns.findIndex(
      (column: ColumnProperties) => column.id === columnId,
    );
    if (originalColumnIndex === -1) {
      originalColumnIndex = index;
    }
  }
  return originalColumnIndex;
};

function ColumnControlComponent(props: RenderComponentProps) {
  const [value, setValue] = useState(props.item.label);
  const {
    updateOption,
    onEdit,
    item,
    deleteOption,
    toggleVisibility,
    index,
  } = props;
  const debouncedUpdate = debounce(updateOption, 500);
  const onChange = (index: number, value: string) => {
    setValue(value);
    debouncedUpdate(index, value);
  };
  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        type="text"
        placeholder="Column Title"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onChange(index, event.target.value);
        }}
        value={value}
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        width={20}
        onClick={() => {
          onEdit && onEdit(index);
        }}
      />
      {!!item.isDerived ? (
        <StyledDeleteIcon
          className="t--delete-column-btn"
          height={20}
          width={20}
          onClick={() => {
            deleteOption && deleteOption(index);
          }}
        />
      ) : item.isVisible ? (
        <StyledVisibleIcon
          className="t--show-column-btn"
          height={20}
          width={20}
          onClick={() => {
            toggleVisibility && toggleVisibility(index);
          }}
        />
      ) : (
        <StyledHiddenIcon
          className="t--show-column-btn"
          height={20}
          width={20}
          onClick={() => {
            toggleVisibility && toggleVisibility(index);
          }}
        />
      )}
    </ItemWrapper>
  );
}

class PrimaryColumnsControl extends BaseControl<ControlProps> {
  render() {
    // Get columns from widget properties
    let columns = this.props.propertyValue || [];
    columns = columns
      ?.map((column: ColumnProperties) => {
        if (Array.isArray(column) && column.length === 0) {
          return undefined;
        }
        return column;
      })
      .filter(Boolean);
    // If there are no columns, show empty state
    if (columns.length === 0) {
      return <EmptyDataState />;
    }
    // Get an empty array of length of columns
    let columnOrder: string[] = new Array(columns.length);

    if (this.props.widgetProperties.columnOrder) {
      columnOrder = this.props.widgetProperties.columnOrder;
    } else {
      for (let i = 0; i < columns.length; i++) {
        const item: Record<string, unknown> = columns[i];
        columnOrder[item.index as number] = item.id as string;
      }
    }
    const reorderdColumns: Array<Record<string, any>> = reorderColumns(
      columns,
      columnOrder,
    ) as Array<Record<string, any>>;
    return (
      <TabsWrapper>
        <DroppableComponent
          items={reorderdColumns}
          renderComponent={ColumnControlComponent}
          updateOption={this.updateOption}
          updateItems={this.updateItems}
          deleteOption={this.deleteOption}
          toggleVisibility={this.toggleVisibility}
          onEdit={this.onEdit}
        />
        <AddColumnButton
          className="t--add-column-btn"
          text="Add a new column"
          icon="plus"
          color="#FFFFFF"
          minimal={true}
          onClick={this.addNewColumn}
        />
      </TabsWrapper>
    );
  }

  addNewColumn = () => {
    const columns: ColumnProperties[] = this.props.propertyValue || [];
    const newColumnName = getNextEntityName(
      "customColumn",
      columns
        .filter((column: ColumnProperties) => column.isDerived)
        .map((column: ColumnProperties) => column.id),
    );
    const columnProps: ColumnProperties = getDefaultColumnProperties(
      newColumnName,
      columns.length,
      this.props.widgetProperties.widgetName,
      true,
    );
    const tableStyles = getTableStyles(this.props.widgetProperties);
    const column = {
      ...columnProps,
      buttonStyle: "#29CCA3",
      buttonLabelColor: "#FFFFFF",
      ...tableStyles,
    };

    this.updateProperty(
      `${this.props.propertyName}[${columns.length}]`,
      column,
    );
  };

  onEdit = (index: number) => {
    const columns = this.props.propertyValue || [];
    const originalColumnIndex = getOriginalColumnIndex(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );
    const column: ColumnProperties = columns[originalColumnIndex];
    this.props.openNextPanel(column);
  };
  //Used to reorder columns
  updateItems = (items: Array<Record<string, unknown>>) => {
    const indexedColumns: string[] = new Array(items.length);
    items.map((item: Record<string, unknown>, index) => {
      indexedColumns[index] = item.id as string;
    });
    this.updateProperty("columnOrder", indexedColumns);
  };

  toggleVisibility = (index: number) => {
    const columns: ColumnProperties[] = this.props.propertyValue || [];
    const originalColumnIndex = getOriginalColumnIndex(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    this.updateProperty(
      `${this.props.propertyName}[${originalColumnIndex}].isVisible`,
      !columns[originalColumnIndex].isVisible,
    );
  };

  deleteOption = (index: number) => {
    const columns: ColumnProperties[] = this.props.propertyValue || [];

    const originalColumnIndex = getOriginalColumnIndex(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );
    const propertiesToDelete = [
      `${this.props.propertyName}[${originalColumnIndex}]`,
    ];
    const originalColumn = columns[originalColumnIndex];
    const derivedColumnIndex = this.props.widgetProperties.derivedColumns?.findIndex(
      (column: ColumnProperties) => column.id === originalColumn?.id,
    );
    if (derivedColumnIndex > -1) {
      propertiesToDelete.push(`derivedColumns[${derivedColumnIndex}]`);
    }
    const columnOrderIndex = this.props.widgetProperties.columnOrder.findIndex(
      (column: string) => column === originalColumn.id,
    );
    propertiesToDelete.push(`columnOrder[${columnOrderIndex}]`);

    this.deleteProperties(propertiesToDelete);
  };

  updateOption = (index: number, updatedLabel: string) => {
    const columns: ColumnProperties[] = this.props.propertyValue || [];
    const originalColumnIndex = getOriginalColumnIndex(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    this.updateProperty(
      `${this.props.propertyName}[${originalColumnIndex}].label`,
      updatedLabel,
    );
  };

  static getControlType() {
    return "PRIMARY_COLUMNS";
  }
}

export default PrimaryColumnsControl;
