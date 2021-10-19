import React from "react";
import { noop } from "lodash";

import styled from "constants/DefaultTheme";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  DroppableComponent,
  RenderComponentProps,
} from "components/ads/DraggableListComponent";
import {
  StyledDeleteIcon,
  StyledDragIcon,
  StyledEditIcon,
  StyledInputGroup,
} from "./StyledControls";
import { Schema } from "widgets/FormBuilderWidget/constants";

const TabsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const ItemWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
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

function DroppableRenderComponent(props: RenderComponentProps) {
  const { index, item, onEdit } = props;

  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        placeholder="Column Title"
        value={item.label}
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        onClick={() => onEdit?.(index)}
        width={20}
      />
      <StyledDeleteIcon
        className="t--delete-column-btn"
        height={20}
        onClick={() => {
          // deleteOption && deleteOption(index);
        }}
        width={20}
      />
    </ItemWrapper>
  );
}

class FieldConfigurationControl extends BaseControl<ControlProps> {
  onEdit = (index: number) => {
    const schema: Schema = this.props.propertyValue || {};
    const entries = Object.values(schema) || [];

    this.props.openNextPanel({
      ...entries[index],
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };

  render() {
    const { propertyValue = {} } = this.props;
    const schema: Schema = propertyValue;
    const entries = Object.values(schema) || [];

    const draggableComponentColumns = entries.map(({ label, name }, index) => ({
      index,
      id: name,
      label,
    }));

    return (
      <TabsWrapper>
        <DroppableComponent
          deleteOption={noop}
          itemHeight={45}
          items={draggableComponentColumns}
          onEdit={this.onEdit}
          renderComponent={DroppableRenderComponent}
          updateItems={noop}
          updateOption={noop}
        />
      </TabsWrapper>
    );
  }

  static getControlType() {
    return "FIELD_CONFIGURATION";
  }
}

export default FieldConfigurationControl;
