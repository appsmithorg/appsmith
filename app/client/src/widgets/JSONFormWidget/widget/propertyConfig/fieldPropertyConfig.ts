import { isEmpty } from "lodash";

import { PanelConfig } from "constants/PropertyControlConstants";
import { FieldType } from "widgets/JSONFormWidget/constants";
import { getSchemaItem, HiddenFnParams } from "./helper";
import {
  CHECKBOX_PROPERTIES,
  COMMON_PROPERTIES,
  DATE_PROPERTIES,
  INPUT_PROPERTIES,
  MULTI_SELECT_PROPERTIES,
  RADIO_GROUP_PROPERTIES,
  SELECT_PROPERTIES,
  SWITCH_PROPERTIES,
} from "./properties";

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
          ...CHECKBOX_PROPERTIES.general,
          ...DATE_PROPERTIES.general,
          ...INPUT_PROPERTIES.general,
          ...RADIO_GROUP_PROPERTIES.general,
          ...SELECT_PROPERTIES.general,
          ...SWITCH_PROPERTIES.general,
          ...MULTI_SELECT_PROPERTIES.general,
          ...COMMON_PROPERTIES.accessibility,
          {
            propertyName: "children",
            label: "Field Configuration",
            controlType: "FIELD_CONFIGURATION",
            isBindProperty: false,
            isTriggerProperty: false,
            panelConfig: generatePanelPropertyConfig(nestingLevel - 1),
            hidden: (...args: HiddenFnParams) => {
              return getSchemaItem(...args).then((schemaItem) => {
                return (
                  schemaItem.fieldType !== FieldType.OBJECT &&
                  isEmpty(schemaItem.children)
                );
              });
            },
            dependencies: ["schema"],
          },
        ],
      },
      {
        sectionName: "Label Styles",
        children: [...COMMON_PROPERTIES.labelStyles],
      },
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
      },
    ],
  } as PanelConfig;
}

export default generatePanelPropertyConfig;
