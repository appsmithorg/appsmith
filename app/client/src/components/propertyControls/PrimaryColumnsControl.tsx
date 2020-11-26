import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledInputGroup,
  StyledDragIcon,
  StyledEditIcon,
  StyledDeleteIcon,
  StyledVisibleIcon,
  StyledPropertyPaneButton,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { DroppableComponent } from "components/designSystems/appsmith/DraggableListComponent";
import { ColumnProperties } from "widgets/TableWidget";
import EmptyDataState from "components/utils/EmptyDataState";
import { getNextEntityName } from "utils/AppsmithUtils";
import {
  getDefaultColumnProperties,
  reorderColumns,
} from "components/designSystems/appsmith/TableUtilities";
import produce from "immer";

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
  };
  updateOption: (index: number, value: string) => void;
  onEdit?: (index: number) => void;
  deleteOption: (index: number) => void;
  toggleVisibility?: (index: number) => void;
};

function ColumnControlComponent(props: RenderComponentProps) {
  const {
    updateOption,
    onEdit,
    item,
    deleteOption,
    toggleVisibility,
    index,
  } = props;
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
      ) : (
        <StyledVisibleIcon
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
    const columns = this.props.propertyValue || [];
    if (columns.length === 0) {
      return <EmptyDataState />;
    }
    const columnOrder: string[] = new Array(columns.length);
    for (let i = 0; i < columns.length; i++) {
      const item: Record<string, unknown> = columns[i];
      columnOrder[item.index as number] = item.id as string;
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
      "DERIVED",
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
    const column = {
      ...columnProps,
      buttonStyle: "#29CCA3",
      buttonLabelColor: "#FFFFFF",
    };
    const updatedColumns: ColumnProperties[] = produce(columns, draft => {
      draft.push(column);
    });
    this.updateProperty(this.props.propertyName, updatedColumns);
  };

  onEdit = (index: number) => {
    const columns = this.props.propertyValue || [];
    const column: ColumnProperties = columns[index];
    this.props.openNextPanel(column);
  };

  updateItems = (items: Array<Record<string, unknown>>) => {
    const indexedColumns: string[] = new Array(items.length);
    items.map((item: Record<string, unknown>, index) => {
      indexedColumns[index] = item.id as string;
    });
    const columns: ColumnProperties[] = [...(this.props.propertyValue || [])];
    const updatedColumns = columns.map((column: ColumnProperties) => {
      const columnIndex = indexedColumns.indexOf(column.id);
      return {
        ...column,
        index: columnIndex,
      };
    });
    this.updateProperty(this.props.propertyName, updatedColumns);
  };

  toggleVisibility = (index: number) => {
    const columns: ColumnProperties[] = this.props.propertyValue || [];
    const updatedColumns: ColumnProperties[] = produce(
      columns,
      (draft: ColumnProperties[]) => {
        draft[index].isVisible = !draft[index].isVisible;
      },
    );
    this.updateProperty(this.props.propertyName, updatedColumns);
  };

  deleteOption = (index: number) => {
    const columns: ColumnProperties[] = this.props.propertyValue || [];
    const updatedColumns: ColumnProperties[] = [...columns];
    updatedColumns.splice(index, 1);
    this.updateProperty(this.props.propertyName, updatedColumns);
  };

  updateOption = (index: number, updatedLabel: string) => {
    const columns: ColumnProperties[] = this.props.propertyValue || [];
    const updatedColumns: ColumnProperties[] = produce(
      columns,
      (draft: ColumnProperties[]) => {
        draft[index].label = updatedLabel;
      },
    );

    this.updateProperty(this.props.propertyName, updatedColumns);
  };

  static getControlType() {
    return "PRIMARY_COLUMNS";
  }
}

export default PrimaryColumnsControl;
