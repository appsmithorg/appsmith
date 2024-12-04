import { objectKeys } from "@appsmith/utils";
import startCase from "lodash/startCase";
import capitalize from "lodash/capitalize";
import { ValidationTypes } from "constants/WidgetValidation";
import { COMPONENT_SIZE } from "../../constants";

export const propertyPaneStyleConfig = [
  {
    sectionName: "General",
    children: [
      {
        propertyName: "elevatedBackground",
        label: "Visual Separation",
        controlType: "SWITCH",
        fullWidth: true,
        helpText:
          "Sets the semantic elevated background and/or borders of the section. This separates the section visually. This could be useful for separating the contents of this section visually from the rest of the sections in the page",
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        isReusable: true,
        validation: {
          type: ValidationTypes.BOOLEAN,
        },
      },
      {
        propertyName: "size",
        label: "Height",
        controlType: "DROP_DOWN",
        fullWidth: true,
        helpText: "Sets the height of the chat widget",
        options: objectKeys(COMPONENT_SIZE).map((size) => ({
          label: capitalize(
            startCase(COMPONENT_SIZE[size as keyof typeof COMPONENT_SIZE]),
          ),
          value: COMPONENT_SIZE[size as keyof typeof COMPONENT_SIZE],
        })),
        isJSConvertible: true,
        isBindProperty: true,
        isTriggerProperty: false,
        isReusable: true,
        validation: {
          type: ValidationTypes.TEXT,
          params: {
            allowedValues: Object.values(COMPONENT_SIZE),
          },
        },
      },
    ],
  },
];
