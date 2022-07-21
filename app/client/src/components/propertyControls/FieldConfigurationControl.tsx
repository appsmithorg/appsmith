import React from "react";
import log from "loglevel";
import { klona } from "klona";
import { isEmpty, isString, maxBy, set, sortBy } from "lodash";

import BaseControl, { ControlProps } from "./BaseControl";
import EmptyDataState from "components/utils/EmptyDataState";
import SchemaParser, {
  getKeysFromSchema,
} from "widgets/JSONFormWidget/schemaParser";
import styled from "constants/DefaultTheme";
import { ARRAY_ITEM_KEY, Schema } from "widgets/JSONFormWidget/constants";
import { Category, Size } from "components/ads/Button";
import {
  BaseItemProps,
  DroppableComponent,
} from "components/ads/DraggableListComponent";
import { DraggableListCard } from "components/ads/DraggableListCard";
import { StyledPropertyPaneButton } from "./StyledControls";
import { getNextEntityName } from "utils/AppsmithUtils";
import { InputText } from "./InputTextControl";
import { JSONFormWidgetProps } from "widgets/JSONFormWidget/widget";

type DroppableItem = BaseItemProps & {
  index: number;
  isCustomField: boolean;
};

type State = {
  focusedIndex: number | null;
};

const TabsWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const AddFieldButton = styled(StyledPropertyPaneButton)`
  width: 100%;
  display: flex;
  justify-content: center;
  &&&& {
    margin-top: 12px;
    margin-bottom: 8px;
  }
`;

const DEFAULT_FIELD_NAME = "customField";

class FieldConfigurationControl extends BaseControl<ControlProps, State> {
  constructor(props: ControlProps) {
    super(props);

    this.state = {
      focusedIndex: null,
    };
  }

  isArrayItem = () => {
    const schema: Schema = this.props.propertyValue;
    return Boolean(schema?.[ARRAY_ITEM_KEY]);
  };

  findSchemaItem = (index: number) => {
    const schema: Schema = this.props.propertyValue;
    const schemaItems = Object.values(schema);
    const sortedSchemaItems = sortBy(schemaItems, ({ position }) => position);
    return sortedSchemaItems[index];
  };

  onEdit = (index: number) => {
    const schemaItem = this.findSchemaItem(index);

    if (schemaItem) {
      this.props.openNextPanel({
        ...schemaItem,
        propPaneId: this.props.widgetProperties.widgetId,
      });
    }
  };

  onDeleteOption = (index: number) => {
    const { propertyName } = this.props;
    const schemaItem = this.findSchemaItem(index);

    if (schemaItem) {
      const itemToDeletePath = `${propertyName}.${schemaItem.identifier}`;

      this.deleteProperties([itemToDeletePath]);
    }
  };

  updateOption = (index: number, updatedLabel: string) => {
    const { propertyName } = this.props;
    const schemaItem = this.findSchemaItem(index);

    if (schemaItem) {
      const { identifier } = schemaItem;

      this.updateProperty(`${propertyName}.${identifier}.label`, updatedLabel);
    }
  };

  toggleVisibility = (index: number) => {
    const { propertyName } = this.props;
    const schemaItem = this.findSchemaItem(index);

    if (schemaItem) {
      const { identifier, isVisible } = schemaItem;

      this.updateProperty(
        `${propertyName}.${identifier}.isVisible`,
        !isVisible,
      );
    }
  };

  addNewField = () => {
    if (this.isArrayItem()) return;

    const { propertyValue = {}, propertyName, widgetProperties } = this.props;
    const {
      childStylesheet,
      widgetName,
    } = widgetProperties as JSONFormWidgetProps;
    const schema: Schema = propertyValue;
    const existingKeys = getKeysFromSchema(schema, ["identifier", "accessor"]);
    const schemaItems = Object.values(schema);
    const lastSchemaItem = maxBy(schemaItems, ({ position }) => position);
    const lastSchemaItemPosition = lastSchemaItem?.position || -1;
    const nextFieldKey = getNextEntityName(DEFAULT_FIELD_NAME, existingKeys);
    const schemaItem = SchemaParser.getSchemaItemFor(nextFieldKey, {
      currSourceData: "",
      widgetName,
      isCustomField: true,
      skipDefaultValueProcessing: true,
      identifier: nextFieldKey,
      fieldThemeStylesheets: childStylesheet,
    });

    schemaItem.position = lastSchemaItemPosition + 1;

    const path = `${propertyName}.${nextFieldKey}`;

    if (isEmpty(widgetProperties.schema)) {
      const newSchema = {
        schema: SchemaParser.parse(widgetProperties.widgetName, {}),
      };
      set(newSchema, path, schemaItem);

      this.updateProperty("schema", newSchema.schema);
    } else {
      /**
       * TODO(Ashit): Not suppose to update the whole schema but just
       * the path within the schema. This is just a hack to make sure
       * the new added paths gets into the dynamicBindingPathList until
       * the updateProperty function is fixed.
       */
      const updatedSchema = {
        schema: klona(widgetProperties.schema),
      };
      set(updatedSchema, path, schemaItem);

      this.updateProperty("schema", updatedSchema.schema);
    }
  };

  onInputChange = (event: React.ChangeEvent<HTMLTextAreaElement> | string) => {
    const value = isString(event) ? event : event.target.value;

    try {
      const parsedValue = JSON.parse(value);
      this.updateProperty(this.props.propertyName, parsedValue);
    } catch (e) {
      log.error(e);
    }
  };

  updateItems = (items: DroppableItem[]) => {
    const { propertyName, propertyValue } = this.props;
    const clonedSchema: Schema = klona(propertyValue);

    items.forEach((item, index) => {
      clonedSchema[item.id].position = index;
    });

    this.updateProperty(propertyName, clonedSchema);
  };

  updateFocus = (index: number, isFocused: boolean) => {
    this.setState({ focusedIndex: isFocused ? index : null });
  };

  render() {
    const { propertyValue = {}, panelConfig } = this.props;
    const schema: Schema = propertyValue;
    const schemaItems = Object.values(schema);

    const addNewFieldButton = (
      <AddFieldButton
        category={Category.tertiary}
        className="t--add-column-btn"
        icon="plus"
        onClick={this.addNewField}
        size={Size.medium}
        tag="button"
        text="Add a new field"
        type="button"
      />
    );

    if (isEmpty(schema)) {
      return (
        <>
          <EmptyDataState />
          {addNewFieldButton}
        </>
      );
    }

    const sortedSchemaItems = sortBy(schemaItems, ({ position }) => position);

    const isMaxLevelReached = !panelConfig;

    const draggableComponentColumns: DroppableItem[] = sortedSchemaItems.map(
      ({ identifier, isCustomField, isVisible, label }, index) => ({
        id: identifier,
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
          focusedIndex={this.state.focusedIndex}
          itemHeight={45}
          items={draggableComponentColumns}
          onEdit={this.onEdit}
          renderComponent={(props) => {
            const { id, isCustomField } = props.item;

            return DraggableListCard({
              ...props,
              toggleVisibility:
                id !== ARRAY_ITEM_KEY ? props.toggleVisibility : undefined,
              isDelete: isCustomField && id !== ARRAY_ITEM_KEY,
              placeholder: "Field label",
            });
          }}
          toggleVisibility={this.toggleVisibility}
          updateFocus={this.updateFocus}
          updateItems={this.updateItems}
          updateOption={this.updateOption}
        />
        {!this.isArrayItem() && addNewFieldButton}
      </TabsWrapper>
    );
  }

  static getControlType() {
    return "FIELD_CONFIGURATION";
  }
}

export default FieldConfigurationControl;
