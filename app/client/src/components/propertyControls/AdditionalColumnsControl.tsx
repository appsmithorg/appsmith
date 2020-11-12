import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledInputGroup,
  StyledPropertyPaneButton,
  StyledDragIcon,
  StyledEditIcon,
  StyledDeleteIcon,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { DroppableComponent } from "../designSystems/appsmith/DraggableListComponent";
import { ColumnProperties } from "widgets/TableWidget";
import { getDefaultColumnProperties } from "components/designSystems/appsmith/TableUtilities";
import { getNextEntityName } from "utils/AppsmithUtils";
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
  };
  updateOption: (index: number, value: string) => void;
  deleteOption: (index: number) => void;
  onEdit?: (index: number) => void;
};

function ColumnControlComponent(props: RenderComponentProps) {
  const { updateOption, item, onEdit, deleteOption, index } = props;
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
      <StyledDeleteIcon
        height={20}
        width={20}
        onClick={() => {
          deleteOption && deleteOption(index);
        }}
      />
      <StyledEditIcon
        height={20}
        width={20}
        onClick={() => {
          onEdit && onEdit(index);
        }}
      />
    </ItemWrapper>
  );
}

class AdditionalColumnsControl extends BaseControl<ControlProps> {
  render() {
    const columns: ColumnProperties[] = this.props.propertyValue || [];
    // if (this.props.widgetProperties.primaryColumns.length === 0) return null;
    return (
      <TabsWrapper>
        <DroppableComponent
          items={columns as any}
          renderComponent={ColumnControlComponent}
          updateOption={this.updateOption}
          updateItems={this.updateItems}
          deleteOption={this.deleteOption}
          onEdit={this.onEdit}
        />
        <AddColumnButton
          text="Add a new column"
          icon="plus"
          color="#FFFFFF"
          minimal={true}
          onClick={this.addNewColumn}
        />
      </TabsWrapper>
    );
  }

  onEdit = (index: number) => {
    const columns = this.props.propertyValue || [];
    const column: ColumnProperties = columns[index];
    this.props.openNextPanel(column);
  };

  addNewColumn = () => {
    const derivedColumns: ColumnProperties[] = this.props.propertyValue || [];
    const index = 1 + derivedColumns.length;
    const newColumnName = getNextEntityName(
      "DERIVED",
      derivedColumns.map((column: ColumnProperties) => column.id),
    );
    const columnProps: ColumnProperties = getDefaultColumnProperties(
      newColumnName,
      index,
    );
    const column = {
      ...columnProps,
      isDerived: true,
      buttonStyle: "#29CCA3",
      buttonLabelColor: "#FFFFFF",
    };
    const updatedDerivedColumns: ColumnProperties[] = [...derivedColumns];
    updatedDerivedColumns.push(column);
    this.updateProperty(this.props.propertyName, updatedDerivedColumns);
  };

  updateItems = (items: Array<Record<string, unknown>>) => {
    this.updateProperty(this.props.propertyName, items);
  };

  deleteOption = (index: number) => {
    const derivedColumns: ColumnProperties[] = this.props.propertyValue || [];
    const updatedDerivedColumns: ColumnProperties[] = [...derivedColumns];
    updatedDerivedColumns.splice(index, 1);
    this.updateProperty(this.props.propertyName, updatedDerivedColumns);
  };

  updateOption = (index: number, updatedLabel: string) => {
    const derivedColumns: ColumnProperties[] = this.props.propertyValue || [];
    const updatedDerivedColumns: ColumnProperties[] = produce(
      derivedColumns,
      (draft: ColumnProperties[]) => {
        draft[index].label = updatedLabel;
      },
    );
    this.updateProperty(this.props.propertyName, updatedDerivedColumns);
  };

  static getControlType() {
    return "ADDITIONAL_COLUMNS";
  }
}

export default AdditionalColumnsControl;
