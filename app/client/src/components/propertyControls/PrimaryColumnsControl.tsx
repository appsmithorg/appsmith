import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  StyledInputGroup,
  StyledDragIcon,
  StyledEditIcon,
  StyledVisibleIcon,
} from "./StyledControls";
import styled from "constants/DefaultTheme";
import { DroppableComponent } from "components/designSystems/appsmith/DraggableListComponent";
import { ColumnProperties } from "widgets/TableWidget";
import EmptyDataState from "components/utils/EmptyDataState";
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

type RenderComponentProps = {
  index: number;
  item: {
    label: string;
  };
  updateOption: (index: number, value: string) => void;
  onEdit?: (index: number) => void;
  deleteOption: (index: number) => void;
};

function ColumnControlComponent(props: RenderComponentProps) {
  const { updateOption, onEdit, item, deleteOption, index } = props;
  console.log({ props });
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
      <StyledVisibleIcon
        className="t--show-column-btn"
        height={20}
        width={20}
        onClick={() => {
          deleteOption && deleteOption(index);
        }}
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        width={20}
        onClick={() => {
          onEdit && onEdit(index);
        }}
      />
    </ItemWrapper>
  );
}

class PrimaryColumnsControl extends BaseControl<ControlProps> {
  render() {
    const columns = this.props.propertyValue || [];
    if (columns.length === 0) {
      return <EmptyDataState />;
    }
    return (
      <TabsWrapper>
        <DroppableComponent
          items={columns}
          renderComponent={ColumnControlComponent}
          updateOption={this.updateOption}
          updateItems={this.updateItems}
          deleteOption={this.deleteOption}
          onEdit={this.onEdit}
        />
      </TabsWrapper>
    );
  }

  onEdit = (index: number) => {
    const columns = this.props.propertyValue || [];
    const column: ColumnProperties = columns[index];
    this.props.openNextPanel(column);
  };

  updateItems = (items: Array<Record<string, unknown>>) => {
    this.updateProperty(this.props.propertyName, items);
  };

  deleteOption = (index: number) => {
    const derivedColumns: ColumnProperties[] = this.props.propertyValue || [];
    const updatedDerivedColumns: ColumnProperties[] = [...derivedColumns];
    updatedDerivedColumns[index].isVisible = !updatedDerivedColumns[index]
      .isVisible;
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
    return "PRIMARY_COLUMNS";
  }
}

export default PrimaryColumnsControl;
