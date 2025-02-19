import { get, has } from "lodash";
import {
  combineDynamicBindings,
  getDynamicBindings,
  isDynamicValue,
  THEME_BINDING_REGEX,
} from "utils/DynamicBindingUtils";
import WidgetFactory from "WidgetProvider/factory";
import { parseSchemaItem } from "widgets/WidgetUtils";
import { ROOT_SCHEMA_KEY } from "widgets/JSONFormWidget/constants";
import { getFieldStylesheet } from "widgets/JSONFormWidget/helper";
import type { UpdateWidgetPropertyPayload } from "actions/controlActions";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";

/**
 * get properties to update for reset
 */
export const getPropertiesToUpdateForReset = (
  canvasWidgets: CanvasWidgetsReduxState,
) => {
  const propertiesToUpdate: UpdateWidgetPropertyPayload[] = [];

  // ignoring these properites as these are objects itself
  // these are used in json form, table and button group
  // to style the children fields/components/widgets
  const propertiesToIgnore = [
    "childStylesheet",
    "submitButtonStyles",
    "resetButtonStyles",
  ];

  // iterating over canvas widgets and their properties
  // so that we can compare them with the value in stylesheet
  // and if they are different, reset the value to the one stored
  // in stylesheet
  Object.keys(canvasWidgets).map((widgetId) => {
    const widget = canvasWidgets[widgetId];
    const stylesheetValue = WidgetFactory.getWidgetStylesheetConfigMap(
      widget.type,
    );
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modifications: any = {};

    if (stylesheetValue) {
      Object.keys(stylesheetValue)
        .filter((propertyKey) => !propertiesToIgnore.includes(propertyKey))
        .map((propertyKey) => {
          if (
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            THEME_BINDING_REGEX.test(stylesheetValue[propertyKey]) &&
            stylesheetValue[propertyKey] !== widget[propertyKey]
          ) {
            modifications[propertyKey] = stylesheetValue[propertyKey];
          }
        });

      if (widget.type === "TABLE_WIDGET") {
        Object.keys(widget.primaryColumns).map((primaryColumnKey) => {
          const primaryColumn = widget.primaryColumns[primaryColumnKey];
          const childStylesheetValue =
            widget.childStylesheet[primaryColumn.columnType];

          if (childStylesheetValue) {
            Object.keys(childStylesheetValue).map((childPropertyKey) => {
              const { jsSnippets, stringSegments } = getDynamicBindings(
                childStylesheetValue[childPropertyKey],
              );

              const js = combineDynamicBindings(jsSnippets, stringSegments);
              const computedValue = `{{${widget.widgetName}.sanitizedTableData.map((currentRow) => ( ${js}))}}`;

              if (computedValue !== primaryColumn[childPropertyKey]) {
                modifications[
                  `primaryColumns.${primaryColumnKey}.${childPropertyKey}`
                ] = computedValue;
              }
            });
          }
        });
      }

      if (widget.type === "BUTTON_GROUP_WIDGET") {
        Object.keys(widget.groupButtons).map((groupButtonName: string) => {
          const groupButton = widget.groupButtons[groupButtonName];

          const childStylesheetValue = stylesheetValue?.childStylesheet?.button;

          childStylesheetValue &&
            Object.keys(childStylesheetValue).map((childPropertyKey) => {
              if (
                get(childStylesheetValue, childPropertyKey) !==
                groupButton[childPropertyKey]
              ) {
                modifications[
                  `groupButtons.${groupButtonName}.${childPropertyKey}`
                ] = get(childStylesheetValue, childPropertyKey);
              }
            });
        });
      }

      if (widget.type === "JSON_FORM_WIDGET") {
        if (has(widget, "schema")) {
          parseSchemaItem(
            widget.schema[ROOT_SCHEMA_KEY],
            `schema.${ROOT_SCHEMA_KEY}`,
            (schemaItem, propertyPath) => {
              const fieldStylesheet = getFieldStylesheet(
                widget.widgetName,
                schemaItem.fieldType,
                // TODO: Fix this the next time the file is edited
                /* eslint-disable @typescript-eslint/no-explicit-any */
                (WidgetFactory.getWidgetStylesheetConfigMap(widget.type) || {})
                  .childStylesheet as any,
                /* eslint-enable @typescript-eslint/no-explicit-any */
              );

              Object.keys(fieldStylesheet).map((fieldPropertyKey) => {
                const fieldStylesheetValue = fieldStylesheet[fieldPropertyKey];

                if (
                  isDynamicValue(fieldStylesheetValue) &&
                  fieldStylesheetValue !== get(schemaItem, fieldPropertyKey)
                ) {
                  modifications[`${[propertyPath]}.${fieldPropertyKey}`] =
                    fieldStylesheetValue;
                }
              });
            },
          );
        }

        // reset submit button
        (["submitButtonStyles", "resetButtonStyles"] as const).map(
          (buttonStyleKey) => {
            Object.keys(get(stylesheetValue, buttonStyleKey, {})).map(
              (propertyKey) => {
                const buttonStylesheetValue = get(
                  stylesheetValue,
                  `${buttonStyleKey}.${propertyKey}`,
                ) as string;

                if (
                  buttonStylesheetValue &&
                  typeof buttonStylesheetValue === "string" &&
                  THEME_BINDING_REGEX.test(buttonStylesheetValue) &&
                  buttonStylesheetValue !==
                    widget[buttonStyleKey][propertyKey] &&
                  buttonStylesheetValue !== widget[buttonStyleKey][propertyKey]
                ) {
                  modifications[`${buttonStyleKey}.${propertyKey}`] =
                    buttonStylesheetValue;
                }
              },
            );
          },
        );
      }

      if (Object.keys(modifications).length > 0) {
        propertiesToUpdate.push({
          widgetId,
          updates: {
            modify: modifications,
          },
        });
      }
    }
  });

  return propertiesToUpdate;
};
