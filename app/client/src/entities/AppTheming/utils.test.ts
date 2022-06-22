import { RenderModes } from "constants/WidgetConstants";
import { getPropertiesToUpdateForReset } from "./utils";

describe("AppThemingSaga test", () => {
  it("Checks if button widget resets to correct value", () => {
    const input = [
      {
        widget1: {
          type: "BUTTON_WIDGET",
          buttonColor: "red",
          widgetId: "widget1",
          widgetName: "widget1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 1,
          parentRowSpace: 1,
          leftColumn: 1,
          rightColumn: 1,
          topRow: 1,
          bottomRow: 1,
          isLoading: false,
        },
      },
      {
        BUTTON_WIDGET: {
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
          resetButtonStyles: {},
          submitButtonStyles: {},
          childStylesheet: {},
        },
      },
    ];

    const output = [
      {
        widgetId: "widget1",
        updates: {
          modify: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
          },
        },
      },
    ];

    //@ts-expect-error: type mismatch
    const result = getPropertiesToUpdateForReset(...input);

    expect(result).toEqual(output);
  });

  it("Checks if table widget resets to correct value", () => {
    const input = [
      {
        widget1: {
          type: "TABLE_WIDGET",
          buttonColor: "red",
          widgetId: "widget1",
          widgetName: "widget1",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentColumnSpace: 1,
          parentRowSpace: 1,
          leftColumn: 1,
          rightColumn: 1,
          topRow: 1,
          bottomRow: 1,
          isLoading: false,
          childStylesheet: {
            button: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          primaryColumns: {
            customColumn1: {
              columnType: "button",
              buttonColor: "pink",
            },
          },
        },
      },
      {
        TABLE_WIDGET: {
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
          resetButtonStyles: {},
          submitButtonStyles: {},
          childStylesheet: {
            button: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
        },
      },
    ];

    const output = [
      {
        widgetId: "widget1",
        updates: {
          modify: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            "primaryColumns.customColumn1.buttonColor":
              "{{widget1.sanitizedTableData.map((currentRow) => ( appsmith.theme.colors.primaryColor))}}",
          },
        },
      },
    ];

    //@ts-expect-error: type mismatch
    const result = getPropertiesToUpdateForReset(...input);

    expect(result).toEqual(output);
  });

  it("Checks if json form widget resets to correct value", () => {
    const input = [
      {
        widget1: {
          isVisible: true,
          schema: {
            __root_schema__: {
              children: {
                name: {
                  children: {},
                  dataType: "string",
                  fieldType: "Text Input",
                  accessor: "name",
                  identifier: "name",
                  position: 0,
                  accentColor: "pink",
                  borderRadius: "100px",
                  boxShadow: "none",
                },
              },
              dataType: "object",
              fieldType: "Object",
              accessor: "__root_schema__",
              identifier: "__root_schema__",
              originalIdentifier: "__root_schema__",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              cellBorderRadius:
                "{{appsmith.theme.borderRadius.appBorderRadius}}",
              cellBoxShadow: "none",
            },
          },
          version: 1,
          widgetName: "JSONForm1",
          type: "JSON_FORM_WIDGET",
          widgetId: "widget1",
          renderMode: "CANVAS",
          borderRadius: "100px",
          boxShadow: "someboxshadowvalue",
          childStylesheet: {
            TEXT_INPUT: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
          },
          isLoading: false,
          parentColumnSpace: 1,
          parentRowSpace: 1,
          leftColumn: 1,
          rightColumn: 1,
          topRow: 1,
          bottomRow: 1,
          parentId: "parentid",
        },
      },
      {
        JSON_FORM_WIDGET: {
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          resetButtonStyles: {},
          submitButtonStyles: {},
          childStylesheet: {
            TEXT_INPUT: {
              accentColor: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
          },
        },
      },
    ];

    const output = [
      {
        widgetId: "widget1",
        updates: {
          modify: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            "schema.__root_schema__.children.name.accentColor":
              "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
            "schema.__root_schema__.children.name.borderRadius":
              "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
          },
        },
      },
    ];

    //@ts-expect-error: type mismatch
    const result = getPropertiesToUpdateForReset(...input);

    expect(result).toEqual(output);
  });
});
