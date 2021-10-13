import React, { useCallback, useEffect, useState } from "react";
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
import { DroppableComponent } from "components/ads/DraggableListComponent";
import { ColumnProperties } from "widgets/TableWidget/component/Constants";
import EmptyDataState from "components/utils/EmptyDataState";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  getDefaultColumnProperties,
  getTableStyles,
} from "widgets/TableWidget/component/TableUtilities";
import { debounce } from "lodash";
import { Size, Category } from "components/ads/Button";
import { reorderColumns } from "widgets/TableWidget/component/TableHelpers";

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
  margin-bottom: 2px;
  width: 100%;
  padding-left: 10px;
  padding-right: 60px;
  text-overflow: ellipsis;
  background: inherit;
  &&& {
    input {
      padding-left: 24px;
      border: none;
      color: ${(props) => props.theme.colors.textOnDarkBG};
      &:focus {
        border: none;
        color: ${(props) => props.theme.colors.textOnDarkBG};
      }
    }
  }
`;

const AddColumnButton = styled(StyledPropertyPaneButton)`
  width: 100%;
  display: flex;
  justify-content: center;
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
  const [isEditing, setEditing] = useState(false);

  useEffect(() => {
    if (!isEditing && props.item && props.item.label)
      setValue(props.item.label);
  }, [props.item?.label, isEditing]);

  const {
    deleteOption,
    index,
    item,
    onEdit,
    toggleVisibility,
    updateOption,
  } = props;
  const [visibility, setVisibility] = useState(item.isVisible);
  const debouncedUpdate = debounce(updateOption, 1000);
  const onChange = useCallback(
    (index: number, value: string) => {
      setValue(value);
      debouncedUpdate(index, value);
    },
    [updateOption],
  );

  const onFocus = () => setEditing(true);
  const onBlur = () => setEditing(false);

  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        onBlur={onBlur}
        onChange={(value: string) => {
          onChange(index, value);
        }}
        onFocus={onFocus}
        placeholder="Column Title"
        value={value}
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        onClick={() => {
          onEdit && onEdit(index);
        }}
        width={20}
      />
      {!!item.isDerived ? (
        <StyledDeleteIcon
          className="t--delete-column-btn"
          height={20}
          onClick={() => {
            deleteOption && deleteOption(index);
          }}
          width={20}
        />
      ) : visibility ? (
        <StyledVisibleIcon
          className="t--show-column-btn"
          height={20}
          onClick={() => {
            setVisibility(!visibility);
            toggleVisibility && toggleVisibility(index);
          }}
          width={20}
        />
      ) : (
        <StyledHiddenIcon
          className="t--show-column-btn"
          height={20}
          onClick={() => {
            setVisibility(!visibility);
            toggleVisibility && toggleVisibility(index);
          }}
          width={20}
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
          deleteOption={this.deleteOption}
          itemHeight={45}
          items={draggableComponentColumns}
          onEdit={this.onEdit}
          renderComponent={ColumnControlComponent}
          toggleVisibility={this.toggleVisibility}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />

        <AddColumnButton
          category={Category.tertiary}
          className="t--add-column-btn"
          icon="plus"
          onClick={this.addNewColumn}
          size={Size.medium}
          tag="button"
          text="Add a new column"
          type="button"
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
      buttonStyle: "rgb(3, 179, 101)",
      buttonLabelColor: "#FFFFFF",
      isDisabled: false,
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

    this.props.openNextPanel({
      ...originalColumn,
      propPaneId: this.props.widgetProperties.widgetId,
    });
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
    const columnOrder = this.props.widgetProperties.columnOrder || [];

    const originalColumn = getOriginalColumn(columns, index, columnOrder);

    if (originalColumn) {
      const propertiesToDelete = [
        `${this.props.propertyName}.${originalColumn.id}`,
      ];
      if (derivedColumns[originalColumn.id])
        propertiesToDelete.push(`derivedColumns.${originalColumn.id}`);

      const columnOrderIndex = columnOrder.findIndex(
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
