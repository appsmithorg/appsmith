import React, { useState, useCallback } from "react";
import { debounce, noop } from "lodash";

import styled from "constants/DefaultTheme";
import BaseControl, { ControlProps } from "./BaseControl";
import SchemaParser from "widgets/FormBuilderWidget/schemaParser";
import {
  ARRAY_ITEM_KEY,
  Schema,
  SchemaItem,
} from "widgets/FormBuilderWidget/constants";
import { Category, Size } from "components/ads/Button";
import {
  BaseItemProps,
  DroppableComponent,
  RenderComponentProps,
} from "components/ads/DraggableListComponent";
import {
  StyledDeleteIcon,
  StyledDragIcon,
  StyledEditIcon,
  StyledHiddenIcon,
  StyledInputGroup,
  StyledPropertyPaneButton,
  StyledVisibleIcon,
} from "./StyledControls";
import { getNextEntityName } from "utils/AppsmithUtils";
import { InputText } from "./InputTextControl";

type DroppableItem = BaseItemProps & {
  index: number;
  isCustomField: boolean;
};

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

const AddColumnButton = styled(StyledPropertyPaneButton)`
  width: 100%;
  display: flex;
  justify-content: center;
  &&&& {
    margin-top: 12px;
    margin-bottom: 8px;
  }
`;

function DroppableRenderComponent(props: RenderComponentProps<DroppableItem>) {
  const {
    deleteOption,
    index,
    item,
    onEdit,
    toggleVisibility,
    updateOption,
  } = props;
  const { id, isCustomField, isVisible, label = "" } = item;

  const [value, setValue] = useState(label);

  const onLabelChange = useCallback(
    (index: number, value: string) => {
      const debouncedUpdate = debounce(updateOption, 1000);
      setValue(value);
      debouncedUpdate(index, value);
    },
    [updateOption],
  );

  const deleteIcon = (() => {
    if (!isCustomField || id === ARRAY_ITEM_KEY) return null;

    return (
      <StyledDeleteIcon
        className="t--delete-column-btn"
        height={20}
        onClick={() => {
          deleteOption?.(index);
        }}
        width={20}
      />
    );
  })();

  const hideShowIcon = (() => {
    if (isCustomField || id === ARRAY_ITEM_KEY) return null;

    return isVisible ? (
      <StyledVisibleIcon
        className="t--show-column-btn"
        height={20}
        onClick={() => {
          toggleVisibility?.(index);
        }}
        width={20}
      />
    ) : (
      <StyledHiddenIcon
        className="t--show-column-btn"
        height={20}
        onClick={() => {
          toggleVisibility?.(index);
        }}
        width={20}
      />
    );
  })();

  return (
    <ItemWrapper>
      <StyledDragIcon height={20} width={20} />
      <StyledOptionControlInputGroup
        dataType="text"
        onChange={(value: string) => {
          onLabelChange(index, value);
        }}
        placeholder="Column Title"
        value={value}
      />
      <StyledEditIcon
        className="t--edit-column-btn"
        height={20}
        onClick={() => onEdit?.(index)}
        width={20}
      />
      {deleteIcon}
      {hideShowIcon}
    </ItemWrapper>
  );
}

class FieldConfigurationControl extends BaseControl<ControlProps> {
  isArrayItem = () => {
    const schema: Schema = this.props.propertyValue;
    return Boolean(schema?.[ARRAY_ITEM_KEY]);
  };

  onEdit = (index: number) => {
    const schema: Schema = this.props.propertyValue || {};
    const entries = Object.values(schema) || [];

    this.props.openNextPanel({
      ...entries[index],
      propPaneId: this.props.widgetProperties.widgetId,
    });
  };

  onDeleteOption = (index: number) => {
    const { propertyName, propertyValue } = this.props;
    const schema: Schema = propertyValue || {};
    const entries = Object.values(schema) || [];

    const schemaItem: SchemaItem = entries[index];

    if (schemaItem) {
      const itemToDeletePath = `${propertyName}.${schemaItem.name}`;

      this.deleteProperties([itemToDeletePath]);
    }
  };

  updateOption = (index: number, updatedLabel: string) => {
    const { propertyName, propertyValue } = this.props;
    const schema: Schema = propertyValue;
    const entries = Object.values(schema);
    const { name } = entries[index];

    this.updateProperty(`${propertyName}.${name}.label`, updatedLabel);
  };

  toggleVisibility = (index: number) => {
    const { propertyName, propertyValue } = this.props;
    const schema: Schema = propertyValue;
    const entries = Object.values(schema);
    const { isVisible, name } = entries[index];

    this.updateProperty(`${propertyName}.${name}.isVisible`, !isVisible);
  };

  addNewColumn = () => {
    if (this.isArrayItem()) return;

    const { propertyValue = {}, propertyName } = this.props;
    const schema: Schema = propertyValue;
    const existingKeys = Object.keys(schema);
    const nextFieldKey = getNextEntityName("customField", existingKeys);
    const schemaItem = SchemaParser.getSchemaItemFor(nextFieldKey, {
      currFormData: "",
    });

    schemaItem.isCustomField = true;

    this.updateProperty(`${propertyName}.${nextFieldKey}`, schemaItem);
  };

  onInputChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    let value = event;
    if (typeof event !== "string") {
      value = event.target.value;
    }

    try {
      const parsedValue = JSON.parse(value as string);
      this.updateProperty(this.props.propertyName, parsedValue);
    } catch {
      // TODO: Try to throw some error
    }
  };

  render() {
    const { propertyValue = {}, panelConfig } = this.props;
    const schema: Schema = propertyValue;
    const entries = Object.values(schema) || [];

    const isMaxLevelReached = Boolean(!panelConfig);

    const draggableComponentColumns: DroppableItem[] = entries.map(
      ({ isCustomField, isVisible, label, name }, index) => ({
        id: name,
        index,
        isCustomField,
        isVisible,
        label,
      }),
    );

    if (isMaxLevelReached) {
      const {
        additionalAutoComplete,
        dataTreePath,
        expected,
        hideEvaluatedValue,
        label,
        theme,
      } = this.props;
      const value = JSON.stringify(schema, null, 2);

      return (
        <InputText
          additionalAutocomplete={additionalAutoComplete}
          dataTreePath={dataTreePath}
          expected={expected}
          hideEvaluatedValue={hideEvaluatedValue}
          label={label}
          onChange={this.onInputChange}
          placeholder="{ name: 'John', dataType: 'string' }"
          theme={theme}
          value={value || "{}"}
        />
      );
    }

    return (
      <TabsWrapper>
        <DroppableComponent
          deleteOption={this.onDeleteOption}
          itemHeight={45}
          items={draggableComponentColumns}
          onEdit={this.onEdit}
          renderComponent={DroppableRenderComponent}
          toggleVisibility={this.toggleVisibility}
          updateItems={noop}
          updateOption={this.updateOption}
        />
        {!this.isArrayItem() && (
          <AddColumnButton
            category={Category.tertiary}
            className="t--add-column-btn"
            icon="plus"
            onClick={this.addNewColumn}
            size={Size.medium}
            tag="button"
            text="Add a new field"
            type="button"
          />
        )}
      </TabsWrapper>
    );
  }

  static getControlType() {
    return "FIELD_CONFIGURATION";
  }
}

export default FieldConfigurationControl;
