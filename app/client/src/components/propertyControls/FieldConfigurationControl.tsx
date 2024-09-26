import React from "react";
import log from "loglevel";
import { isEmpty, isString, maxBy, set, sortBy } from "lodash";

import type { ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import SchemaParser, {
  getKeysFromSchema,
} from "widgets/JSONFormWidget/schemaParser";
import type { Schema } from "widgets/JSONFormWidget/constants";
import { ARRAY_ITEM_KEY } from "widgets/JSONFormWidget/constants";
import { Button, Text } from "@appsmith/ads";
import type { BaseItemProps } from "./DraggableListComponent";
import { DraggableListCard } from "components/propertyControls/DraggableListCard";
import { getNextEntityName } from "utils/AppsmithUtils";
import { InputText } from "./InputTextControl";
import type { JSONFormWidgetProps } from "widgets/JSONFormWidget/widget";
import { DraggableListControl } from "pages/Editor/PropertyPane/DraggableListControl";
import styled from "styled-components";
import { NO_FIELDS_ADDED, createMessage } from "ee/constants/messages";

import {
  itemHeight,
  noOfItemsToDisplay,
  extraSpace,
} from "widgets/JSONFormWidget/constants";

import { klonaRegularWithTelemetry } from "utils/helpers";

type DroppableItem = BaseItemProps & {
  index: number;
  isCustomField: boolean;
};

interface State {
  focusedIndex: number | null;
}

const DEFAULT_FIELD_NAME = "customField";

const fixedHeight = itemHeight * noOfItemsToDisplay + extraSpace;

const FlexContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledText = styled(Text)`
  margin: 20px;
  text-align: center;
`;

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
        index,
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

    const { propertyName, propertyValue = {}, widgetProperties } = this.props;
    const { childStylesheet, widgetName } =
      widgetProperties as JSONFormWidgetProps;
    const schema: Schema = propertyValue;
    const existingKeys = getKeysFromSchema(schema, ["identifier", "accessor"]);
    const schemaItems = Object.values(schema);
    const lastSchemaItem = maxBy(schemaItems, ({ position }) => position);
    const lastSchemaItemPosition = lastSchemaItem?.position ?? -1;
    const nextFieldKey = getNextEntityName(DEFAULT_FIELD_NAME, existingKeys);
    const schemaItem = SchemaParser.getSchemaItemFor(nextFieldKey, {
      currSourceData: "",
      widgetName,
      isCustomField: true,
      skipDefaultValueProcessing: true,
      baseSchemaPath: null,
      removedSchemaItems: [],
      modifiedSchemaItems: {},
      identifier: nextFieldKey,
      fieldThemeStylesheets: childStylesheet,
    });

    schemaItem.position = lastSchemaItemPosition + 1;

    const path = `${propertyName}.${nextFieldKey}`;

    if (isEmpty(widgetProperties.schema)) {
      const newSchema = {
        schema: SchemaParser.parse(widgetProperties.widgetName, {
          currSourceData: {},
        }), // since we need sourceData to generate root schema, we initialize the parser with {} object if there is no source data.
      };

      const { schema: schemaObject } = newSchema; // This is {schema:{__root_schema__},..rest}

      set(schemaObject, path, schemaItem);

      this.updateProperty("schema", schemaObject.schema); // This updates the schema property with the schema property of the newSchema object {schema:{schema:{__root_schema__:{}}}} => {schema:{__root_schema__:{}}}
    } else {
      /**
       * TODO(Ashit): Not suppose to update the whole schema but just
       * the path within the schema. This is just a hack to make sure
       * the new added paths gets into the dynamicBindingPathList until
       * the updateProperty function is fixed.
       */

      const updatedSchema = {
        schema: klonaRegularWithTelemetry(
          widgetProperties.schema,
          "FieldConfigurationControl.addNewField",
        ),
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
    const clonedSchema: Schema = klonaRegularWithTelemetry(
      propertyValue,
      "FieldConfigurationControl.updateItems",
    );

    items.forEach((item, index) => {
      clonedSchema[item.id].position = index;
    });

    this.updateProperty(propertyName, clonedSchema);
  };

  updateFocus = (index: number, isFocused: boolean) => {
    this.setState({ focusedIndex: isFocused ? index : null });
  };

  render() {
    const { panelConfig, propertyValue = {} } = this.props;
    const schema: Schema = propertyValue;
    const schemaItems = Object.values(schema);

    const addNewFieldButton = (
      <Button
        className="self-end t--add-column-btn"
        kind="tertiary"
        onClick={this.addNewField}
        size="sm"
        startIcon="plus"
      >
        Add new field
      </Button>
    );

    if (isEmpty(schema)) {
      return (
        <FlexContainer>
          <StyledText color="var(--ads-v2-color-fg-muted)" kind="body-s">
            {createMessage(NO_FIELDS_ADDED)}
          </StyledText>
          {addNewFieldButton}
        </FlexContainer>
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
      <div className="flex flex-col w-full gap-1">
        <DraggableListControl
          deleteOption={this.onDeleteOption}
          fixedHeight={fixedHeight}
          focusedIndex={this.state.focusedIndex}
          itemHeight={itemHeight}
          items={draggableComponentColumns}
          onEdit={this.onEdit}
          propertyPath={this.props.dataTreePath}
          // TODO: Fix this the next time the file is edited
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          renderComponent={(props: any) => {
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
      </div>
    );
  }

  static getControlType() {
    return "FIELD_CONFIGURATION";
  }
}

export default FieldConfigurationControl;
