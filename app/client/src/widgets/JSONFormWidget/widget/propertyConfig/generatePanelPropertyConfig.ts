import { get, isEmpty } from "lodash";

import { PanelConfig } from "constants/PropertyControlConstants";
import {
  ARRAY_ITEM_KEY,
  FieldType,
  SchemaItem,
} from "widgets/JSONFormWidget/constants";
import { getSchemaItem, HiddenFnParams } from "./helper";
import {
  ARRAY_PROPERTIES,
  CHECKBOX_PROPERTIES,
  COMMON_PROPERTIES,
  DATE_PROPERTIES,
  INPUT_PROPERTIES,
  MULTI_SELECT_PROPERTIES,
  OBJECT_PROPERTIES,
  RADIO_GROUP_PROPERTIES,
  SELECT_PROPERTIES,
  SWITCH_PROPERTIES,
} from "./properties";
import { JSONFormWidgetProps } from "..";

function generatePanelPropertyConfig(
  nestingLevel: number,
): PanelConfig | undefined {
  if (nestingLevel === 0) return;

  return {
    editableTitle: true,
    titlePropertyName: "label",
    panelIdPropertyName: "identifier",
    children: [
      {
        sectionName: "General",
        children: [
          ...COMMON_PROPERTIES.fieldType,
          ...COMMON_PROPERTIES.customField,
          ...COMMON_PROPERTIES.options,
          ...ARRAY_PROPERTIES.general,
          ...CHECKBOX_PROPERTIES.general,
          ...DATE_PROPERTIES.general,
          ...INPUT_PROPERTIES.general,
          ...MULTI_SELECT_PROPERTIES.general,
          ...RADIO_GROUP_PROPERTIES.general,
          ...SELECT_PROPERTIES.general,
          ...SWITCH_PROPERTIES.general,
          ...COMMON_PROPERTIES.accessibility,
          ...ARRAY_PROPERTIES.accessibility,
          {
            propertyName: "children",
            label: "Field Configuration",
            controlType: "FIELD_CONFIGURATION",
            isBindProperty: false,
            isTriggerProperty: false,
            panelConfig: generatePanelPropertyConfig(nestingLevel - 1),
            hidden: (...args: HiddenFnParams) => {
              return getSchemaItem(...args).compute((schemaItem) => {
                return (
                  schemaItem.fieldType !== FieldType.OBJECT &&
                  isEmpty(schemaItem.children)
                );
              });
            },
            dependencies: ["schema", "childStylesheet"],
          },
        ],
      },
      {
        sectionName: "Label Styles",
        children: [...COMMON_PROPERTIES.labelStyles],
        hidden: (props: JSONFormWidgetProps, propertyPath: string) => {
          const schemaItem: SchemaItem = get(props, propertyPath, {});

          return (
            schemaItem.identifier === ARRAY_ITEM_KEY &&
            schemaItem.fieldType === FieldType.OBJECT
          );
        },
      },
      {
        sectionName: "Styles",
        children: [...COMMON_PROPERTIES.styles],
        hidden: (props: JSONFormWidgetProps, propertyPath: string) => {
          const schemaItem: SchemaItem = get(props, propertyPath, {});

          // Array and Object handle their own style sections
          return (
            schemaItem.fieldType === FieldType.OBJECT ||
            schemaItem.fieldType === FieldType.ARRAY
          );
        },
      },
      ...OBJECT_PROPERTIES.sections,
      ...ARRAY_PROPERTIES.sections,
      {
        sectionName: "Actions",
        children: [
          ...INPUT_PROPERTIES.actions,
          ...CHECKBOX_PROPERTIES.actions,
          ...DATE_PROPERTIES.actions,
          ...RADIO_GROUP_PROPERTIES.actions,
          ...SELECT_PROPERTIES.actions,
          ...SWITCH_PROPERTIES.actions,
          ...MULTI_SELECT_PROPERTIES.actions,
          ...COMMON_PROPERTIES.actions,
        ],
        hidden: (props: JSONFormWidgetProps, propertyPath: string) => {
          const schemaItem: SchemaItem = get(props, propertyPath, {});

          return (
            schemaItem.fieldType === FieldType.OBJECT ||
            schemaItem.fieldType === FieldType.ARRAY ||
            schemaItem.identifier === ARRAY_ITEM_KEY
          );
        },
      },
    ],
  } as PanelConfig;
}

export default generatePanelPropertyConfig;
