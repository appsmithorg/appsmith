import React, { useCallback, useState } from "react";
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
  getTableStyles,
  reorderColumns,
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

const getOriginalColumn = (
  columns: Record<string, ColumnProperties>,
  index: number,
  columnOrder?: string[],
): ColumnProperties | undefined => {
  const reorderedColumns = reorderColumns(columns, columnOrder || []);
  const column: ColumnProperties | undefined = Object.values(
    reorderedColumns,
  ).find((column: ColumnProperties) => column.index === index);
  return column;
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
  const debouncedUpdate = debounce(updateOption, 1000);
  const onChange = useCallback(
    (index: number, value: string) => {
      setValue(value);
      debouncedUpdate(index, value);
    },
    [updateOption],
  );
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
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};

    // If there are no columns, show empty state
    if (Object.keys(columns).length === 0) {
      return <EmptyDataState />;
    }
    // Get an empty array of length of columns
    let columnOrder: string[] = new Array(Object.keys(columns).length);

    if (this.props.widgetProperties.columnOrder) {
      columnOrder = this.props.widgetProperties.columnOrder;
    } else {
      columnOrder = Object.keys(columns);
    }

    const reorderedColumns = reorderColumns(columns, columnOrder);

    const draggableComponentColumns = Object.values(reorderedColumns).map(
      (column: ColumnProperties) => {
        return {
          label: column.label,
          id: column.id,
          isVisible: column.isVisible,
          isDerived: column.isDerived,
          index: column.index,
        };
      },
    );

    return (
      <TabsWrapper>
        <DroppableComponent
          items={draggableComponentColumns}
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
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};
    const columnIds = Object.keys(columns);
    const newColumnName = getNextEntityName("customColumn", columnIds);
    const nextIndex = columnIds.length;
    const columnProps: ColumnProperties = getDefaultColumnProperties(
      newColumnName,
      nextIndex,
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

    this.updateProperty(`${this.props.propertyName}.${column.id}`, column);
  };

  onEdit = (index: number) => {
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || [];

    const originalColumn = getOriginalColumn(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    this.props.openNextPanel(originalColumn);
  };
  //Used to reorder columns
  updateItems = (items: Array<Record<string, unknown>>) => {
    this.updateProperty(
      "columnOrder",
      items.map(({ id }) => id),
    );
  };

  toggleVisibility = (index: number) => {
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};
    const originalColumn = getOriginalColumn(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    if (originalColumn) {
      this.updateProperty(
        `${this.props.propertyName}.${originalColumn.id}.isVisible`,
        !originalColumn.isVisible,
      );
    }
  };

  deleteOption = (index: number) => {
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};
    const derivedColumns = this.props.widgetProperties.derivedColumns || {};

    const originalColumn = getOriginalColumn(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    if (originalColumn) {
      const propertiesToDelete = [
        `${this.props.propertyName}.${originalColumn.id}`,
      ];
      if (derivedColumns[originalColumn.id])
        propertiesToDelete.push(`derivedColumns.${originalColumn.id}`);

      const columnOrderIndex = this.props.widgetProperties.columnOrder.findIndex(
        (column: string) => column === originalColumn.id,
      );
      if (columnOrderIndex > -1)
        propertiesToDelete.push(`columnOrder[${columnOrderIndex}]`);

      this.deleteProperties(propertiesToDelete);
    }
  };

  updateOption = (index: number, updatedLabel: string) => {
    const columns: Record<string, ColumnProperties> =
      this.props.propertyValue || {};
    const originalColumn = getOriginalColumn(
      columns,
      index,
      this.props.widgetProperties.columnOrder,
    );

    if (originalColumn) {
      this.updateProperty(
        `${this.props.propertyName}.${originalColumn.id}.label`,
        updatedLabel,
      );
    }
  };

  static getControlType() {
    return "PRIMARY_COLUMNS";
  }
}

export default PrimaryColumnsControl;
