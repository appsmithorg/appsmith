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
