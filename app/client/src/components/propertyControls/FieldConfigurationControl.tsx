import React from "react";

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
  StyledHiddenIcon,
  StyledInputGroup,
  StyledVisibleIcon,
} from "./StyledControls";
import { Schema, SchemaObject } from "widgets/FormBuilderWidget/constants";
import { noop } from "lodash";
import { PanelConfig } from "constants/PropertyControlConstants";
import { FormBuilderWidgetProps } from "widgets/FormBuilderWidget/widget";

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

const updateDerivedColumnsHook = (
  props: FormBuilderWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  return;
};

/**
 * On change of type of a field
 * 1. update the type
 * 2. Reset the config for that field
 *
 * Note: The logic is, the properties that can be modified will be set
 * in the widget constant
 * Move the PANEL_CONFIG to constants?
 * Properties specific to the field components would reside in the *Field component
 * itself
 *
 * When a field is modified to a non-primitive type, it's children would be removed
 *
 * MAKE OPERATIONS ATOMIC!!!
 */

const PANEL_CONFIG = {
  editableTitle: true,
  titlePropertyName: "config.props.label",
  panelIdPropertyName: "name",
  updateHook: updateDerivedColumnsHook,
  children: [
    {
      sectionName: "FieldControl",
      children: [
        {
          propertyName: "fieldType",
          label: "Field Type",
          controlType: "DROP_DOWN",
          isBindProperty: false,
          isTriggerProperty: false,
          options: [
            {
              label: "Plain Text",
              value: "text",
            },
            {
              label: "URL",
              value: "url",
            },
            {
              label: "Number",
              value: "number",
            },
            {
              label: "Image",
              value: "image",
            },
            {
              label: "Video",
              value: "video",
            },
            {
              label: "Date",
              value: "date",
            },
            {
              label: "Button",
              value: "button",
            },
          ],
        },
        {
          propertyName: "children",
          label: "fieldConfiguration",
          controlType: "FIELD_CONFIGURATION",
          isBindProperty: false,
          isTriggerProperty: false,
        },
      ],
    },
  ],
};

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

    const entries = Object.entries(schema) || [];
    const [key, value] = entries[index];

    this.props.openNextPanel(
      {
        ...value,
        propPaneId: this.props.widgetProperties.widgetId,
      },
      PANEL_CONFIG,
    );
  };

  render() {
    const { dataTreePath, widgetProperties } = this.props;
    const schema = this.props.propertyValue as Schema;
    const entries = Object.entries(schema) || [];

    const draggableComponentColumns = entries.map(
      ([key, schemaObject], index) => ({
        index: index,
        id: key,
        label: schemaObject.title,
      }),
    );

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
