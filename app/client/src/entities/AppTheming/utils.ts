import { get, has } from "lodash";
import {
  combineDynamicBindings,
  getDynamicBindings,
  isDynamicValue,
  THEME_BINDING_REGEX,
} from "utils/DynamicBindingUtils";
import { ROOT_SCHEMA_KEY } from "widgets/JSONFormWidget/constants";
import { parseSchemaItem } from "widgets/WidgetUtils";
import { getFieldStylesheet } from "widgets/JSONFormWidget/helper";
import { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import { AppTheme } from "entities/AppTheming";
import { UpdateWidgetPropertyPayload } from "actions/controlActions";

/**
 * get properties to update for reset
 */
export const getPropertiesToUpdateForReset = (
  canvasWidgets: CanvasWidgetsReduxState,
  themeStylesheet: AppTheme["stylesheet"],
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
    const stylesheetValue = themeStylesheet[widget.type];
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

          const childStylesheetValue = stylesheetValue.childStylesheet.button;

          Object.keys(childStylesheetValue).map((childPropertyKey) => {
            if (
              childStylesheetValue[childPropertyKey] !==
              groupButton[childPropertyKey]
            ) {
              modifications[
                `groupButtons.${groupButtonName}.${childPropertyKey}`
              ] = childStylesheetValue[childPropertyKey];
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
                themeStylesheet[widget.type].childStylesheet as any,
              );

              Object.keys(fieldStylesheet).map((fieldPropertyKey) => {
                const fieldStylesheetValue = fieldStylesheet[fieldPropertyKey];

                if (
                  isDynamicValue(fieldStylesheetValue) &&
                  fieldStylesheetValue !== get(schemaItem, fieldPropertyKey)
                ) {
                  modifications[
                    `${[propertyPath]}.${fieldPropertyKey}`
                  ] = fieldStylesheetValue;
                }
              });
            },
          );
        }

        // reset submit button
        ["submitButtonStyles", "resetButtonStyles"].map((buttonStyleKey) => {
          Object.keys(stylesheetValue[buttonStyleKey]).map((propertyKey) => {
            const buttonStylesheetValue =
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              stylesheetValue[buttonStyleKey][propertyKey];

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            if (
              THEME_BINDING_REGEX.test(buttonStylesheetValue) &&
              buttonStylesheetValue !== widget[buttonStyleKey][propertyKey] &&
              buttonStylesheetValue !== widget[buttonStyleKey][propertyKey]
            ) {
              modifications[
                `${buttonStyleKey}.${propertyKey}`
              ] = buttonStylesheetValue;
            }
          });
        });
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
