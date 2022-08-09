import { get, isEmpty } from "lodash";

import { PanelConfig } from "constants/PropertyControlConstants";
import {
  ARRAY_ITEM_KEY,
  FieldType,
  SchemaItem,
} from "widgets/JSONFormWidget/constants";
import {
  getSchemaItem,
  HiddenFnParams,
  isFieldTypeArrayOrObject,
} from "./helper";
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
    // Add contentChildren & styleChildren here
    // And make use of them in PanelPropertiesEditor
    contentChildren: [
      {
        sectionName: "Data",
        children: [
          ...COMMON_PROPERTIES.content.data,
          ...INPUT_PROPERTIES.content.data,
          ...SWITCH_PROPERTIES.content.data,
          ...SELECT_PROPERTIES.content.data,
          ...RADIO_GROUP_PROPERTIES.content.data,
          ...MULTI_SELECT_PROPERTIES.content.data,
          ...DATE_PROPERTIES.content.data,
          ...CHECKBOX_PROPERTIES.content.data,
          ...ARRAY_PROPERTIES.content.data,
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
        sectionName: "Label",
        children: [
          ...COMMON_PROPERTIES.content.label,
          ...CHECKBOX_PROPERTIES.content.label,
          ...SWITCH_PROPERTIES.content.label,
        ],
      },
      {
        sectionName: "Search and Filters",
        children: [
          ...SELECT_PROPERTIES.content.searchAndFilters,
          ...MULTI_SELECT_PROPERTIES.content.searchAndFilters,
        ],
        hidden: (props: JSONFormWidgetProps, propertyPath: string) => {
          const schemaItem: SchemaItem = get(props, propertyPath, {});
          return !(
            schemaItem.fieldType === FieldType.SELECT ||
            schemaItem.fieldType === FieldType.MULTISELECT
          );
        },
      },
      {
        sectionName: "Validation",
        children: [
          ...INPUT_PROPERTIES.content.validation,
          ...DATE_PROPERTIES.content.validation,
        ],
        hidden: isFieldTypeArrayOrObject,
      },
      {
        sectionName: "General",
        children: [
          ...COMMON_PROPERTIES.content.general,
          ...INPUT_PROPERTIES.content.general,
          ...SELECT_PROPERTIES.content.general,
          ...MULTI_SELECT_PROPERTIES.content.general,
          ...COMMON_PROPERTIES.content.generalSwitch,
          ...MULTI_SELECT_PROPERTIES.content.toggles,
          ...DATE_PROPERTIES.content.general,
          ...ARRAY_PROPERTIES.content.general,
        ],
      },
      {
        sectionName: "Events",
        children: [
          ...CHECKBOX_PROPERTIES.actions,
          ...DATE_PROPERTIES.content.events,
          ...MULTI_SELECT_PROPERTIES.content.events,
          ...INPUT_PROPERTIES.content.events,
          ...SWITCH_PROPERTIES.content.events,
          ...SELECT_PROPERTIES.content.events,
          ...COMMON_PROPERTIES.content.events,
          ...RADIO_GROUP_PROPERTIES.content.events,
        ],
        hidden: isFieldTypeArrayOrObject,
      },
    ],
    styleChildren: [
      {
        sectionName: "Label Styles",
        children: [...COMMON_PROPERTIES.style.label],
      },
      {
        sectionName: "Icon",
        children: [...INPUT_PROPERTIES.style.icon],
        hidden: (props: JSONFormWidgetProps, propertyPath: string) => {
          const schemaItem: SchemaItem = get(props, propertyPath, {});
          return !(
            schemaItem.fieldType === FieldType.TEXT_INPUT ||
            schemaItem.fieldType === FieldType.EMAIL_INPUT ||
            schemaItem.fieldType === FieldType.PASSWORD_INPUT ||
            schemaItem.fieldType === FieldType.NUMBER_INPUT
          );
        },
      },
      {
        sectionName: "Color",
        children: [...COMMON_PROPERTIES.style.color],
        hidden: isFieldTypeArrayOrObject,
      },
      {
        sectionName: "Border and Shadow",
        children: [...COMMON_PROPERTIES.style.borderShadow],
        hidden: (props: JSONFormWidgetProps, propertyPath: string) => {
          const schemaItem: SchemaItem = get(props, propertyPath, {});
          return (
            schemaItem.fieldType === FieldType.ARRAY ||
            schemaItem.fieldType === FieldType.OBJECT ||
            schemaItem.fieldType === FieldType.RADIO_GROUP ||
            schemaItem.fieldType === FieldType.SWITCH
          );
        },
      },
      ...OBJECT_PROPERTIES.sections.map((x) => ({ ...x, isDefaultOpen: true })),
      ...ARRAY_PROPERTIES.sections.map((x) => ({ ...x, isDefaultOpen: true })),
    ],
  } as PanelConfig;
}

export default generatePanelPropertyConfig;
