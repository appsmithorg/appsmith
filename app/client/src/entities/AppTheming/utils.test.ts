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
          buttonColor: "blue",
          resetButtonStyles: {},
          submitButtonStyles: {},
          childStylesheet: {},
        },
      },
    ];

    const output = [
      { widgetId: "widget1", updates: { modify: { buttonColor: "blue" } } },
    ];

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
              buttonColor: "orange",
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
          buttonColor: "blue",
          resetButtonStyles: {},
          submitButtonStyles: {},
          childStylesheet: {
            button: {
              buttonColor: "orange",
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
            buttonColor: "blue",
            "primaryColumns.customColumn1.buttonColor":
              "{{widget1.sanitizedTableData.map((currentRow) => ( 'orange'))}}",
          },
        },
      },
    ];

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
          borderRadius: "200px",
          boxShadow: "oldboxshadowvalue",
          resetButtonStyles: {},
          submitButtonStyles: {},
          childStylesheet: {
            TEXT_INPUT: {
              accentColor: "blue",
              borderRadius: "200px",
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
            borderRadius: "200px",
            boxShadow: "oldboxshadowvalue",
            "schema.__root_schema__.children.name.accentColor": "blue",
            "schema.__root_schema__.children.name.borderRadius": "200px",
          },
        },
      },
    ];

    const result = getPropertiesToUpdateForReset(...input);

    expect(result).toEqual(output);
  });
});
