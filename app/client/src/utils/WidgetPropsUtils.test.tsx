import * as generators from "../utils/generators";
import { RenderModes } from "constants/WidgetConstants";
import {
  migrateChartDataFromArrayToObject,
  migrateToNewLayout,
  migrateInitialValues,
  migrateToNewMultiSelect,
} from "./DSLMigrations";
import {
  buildChildren,
  widgetCanvasFactory,
  buildDslWithChildren,
} from "test/factories/WidgetFactoryUtils";
import { cloneDeep } from "lodash";
import { GRID_DENSITY_MIGRATION_V1 } from "widgets/constants";
import { extractCurrentDSL } from "./WidgetPropsUtils";

describe("WidgetProps tests", () => {
  it("it checks if array to object migration functions for chart widget ", () => {
    const input = {
      type: "CANVAS_WIDGET",
      widgetId: "0",
      widgetName: "canvas",
      parentColumnSpace: 1,
      parentRowSpace: 1,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      version: 17,
      isLoading: false,
      renderMode: RenderModes.CANVAS,
      children: [
        {
          widgetId: "some-random-id",
          widgetName: "chart1",
          parentColumnSpace: 1,
          parentRowSpace: 1,
          leftColumn: 0,
          rightColumn: 0,
          topRow: 0,
          bottomRow: 0,
          version: 17,
          isLoading: false,
          renderMode: RenderModes.CANVAS,
          type: "CHART_WIDGET",
          chartData: [
            {
              seriesName: "seris1",
              data: [{ x: 1, y: 2 }],
            },
          ],
        },
      ],
    };

    // mocking implementation of our generateReactKey function
    const generatorReactKeyMock = jest.spyOn(generators, "generateReactKey");
    generatorReactKeyMock.mockImplementation(() => "some-random-key");

    const result = migrateChartDataFromArrayToObject(input);

    const output = {
      type: "CANVAS_WIDGET",
      widgetId: "0",
      widgetName: "canvas",
      parentColumnSpace: 1,
      parentRowSpace: 1,
      leftColumn: 0,
      rightColumn: 0,
      topRow: 0,
      bottomRow: 0,
      version: 17,
      isLoading: false,
      renderMode: RenderModes.CANVAS,
      children: [
        {
          widgetId: "some-random-id",
          widgetName: "chart1",
          parentColumnSpace: 1,
          parentRowSpace: 1,
          leftColumn: 0,
          rightColumn: 0,
          topRow: 0,
          bottomRow: 0,
          version: 17,
          isLoading: false,
          renderMode: RenderModes.CANVAS,
          type: "CHART_WIDGET",
          dynamicBindingPathList: [],
          chartData: {
            "some-random-key": {
              seriesName: "seris1",
              data: [{ x: 1, y: 2 }],
            },
          },
        },
      ],
    };

    expect(result).toStrictEqual(output);
  });
  it("Grid density migration - Main container widgets", () => {
    const dsl: any = buildDslWithChildren([{ type: "TABS_WIDGET" }]);
    const newMigratedDsl: any = migrateToNewLayout(cloneDeep(dsl));
    expect(dsl.children[0].topRow * GRID_DENSITY_MIGRATION_V1).toBe(
      newMigratedDsl.children[0].topRow,
    );
    expect(dsl.children[0].bottomRow * GRID_DENSITY_MIGRATION_V1).toBe(
      newMigratedDsl.children[0].bottomRow,
    );
    expect(dsl.children[0].rightColumn * GRID_DENSITY_MIGRATION_V1).toBe(
      newMigratedDsl.children[0].rightColumn,
    );
    expect(dsl.children[0].leftColumn * GRID_DENSITY_MIGRATION_V1).toBe(
      newMigratedDsl.children[0].leftColumn,
    );
  });

  it("Grid density migration - widgets inside a container", () => {
    const childrenInsideContainer = buildChildren([
      { type: "SWITCH_WIDGET" },
      { type: "FORM_WIDGET" },
      { type: "CONTAINER_WIDGET" },
    ]);
    const dslWithContainer: any = buildDslWithChildren([
      { type: "CONTAINER_WIDGET", children: childrenInsideContainer },
    ]);
    const newMigratedDsl: any = migrateToNewLayout(cloneDeep(dslWithContainer));
    // Container migrated checks
    const containerWidget = dslWithContainer.children[0];
    const migratedContainer = newMigratedDsl.children[0];
    expect(containerWidget.topRow * GRID_DENSITY_MIGRATION_V1).toBe(
      migratedContainer.topRow,
    );
    expect(containerWidget.bottomRow * GRID_DENSITY_MIGRATION_V1).toBe(
      migratedContainer.bottomRow,
    );
    expect(containerWidget.rightColumn * GRID_DENSITY_MIGRATION_V1).toBe(
      migratedContainer.rightColumn,
    );
    expect(containerWidget.leftColumn * GRID_DENSITY_MIGRATION_V1).toBe(
      migratedContainer.leftColumn,
    );
    // Children inside container miragted

    containerWidget.children.forEach((eachChild: any, index: any) => {
      const migratedChild = migratedContainer.children[index];
      expect(eachChild.topRow * GRID_DENSITY_MIGRATION_V1).toBe(
        migratedChild.topRow,
      );
      expect(eachChild.bottomRow * GRID_DENSITY_MIGRATION_V1).toBe(
        migratedChild.bottomRow,
      );
      expect(eachChild.rightColumn * GRID_DENSITY_MIGRATION_V1).toBe(
        migratedChild.rightColumn,
      );
      expect(eachChild.leftColumn * GRID_DENSITY_MIGRATION_V1).toBe(
        migratedChild.leftColumn,
      );
    });
  });
});

describe("Initial value migration test", () => {
  const containerWidget = {
    widgetName: "MainContainer",
    backgroundColor: "none",
    rightColumn: 1118,
    snapColumns: 16,
    detachFromLayout: true,
    widgetId: "0",
    topRow: 0,
    bottomRow: 560,
    snapRows: 33,
    isLoading: false,
    parentRowSpace: 1,
    type: "CANVAS_WIDGET",
    renderMode: RenderModes.CANVAS,
    canExtend: true,
    version: 18,
    minHeight: 600,
    parentColumnSpace: 1,
    dynamicTriggerPathList: [],
    dynamicBindingPathList: [],
    leftColumn: 0,
  };

  it("Input widget", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Input1",
          rightColumn: 8,
          widgetId: "ra3vyy3nt2",
          topRow: 1,
          bottomRow: 2,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          type: "INPUT_WIDGET",
          version: 1,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 3,
          inputType: "TEXT",
          renderMode: RenderModes.CANVAS,
          resetOnSubmit: false,
        },
      ],
    };
    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "Input1",
          rightColumn: 8,
          widgetId: "ra3vyy3nt2",
          topRow: 1,
          bottomRow: 2,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          type: "INPUT_WIDGET",
          version: 1,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          renderMode: "CANVAS",
          leftColumn: 3,
          inputType: "TEXT",
          // will not override existing property
          resetOnSubmit: false,
          // following properties get added
          isRequired: false,
          isDisabled: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("SELECT_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Select1",
          rightColumn: 6,
          selectionType: "SINGLE_SELECT",
          widgetId: "1e3ytl2pl9",
          topRow: 3,
          bottomRow: 4,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          isRequired: false,
          isDisabled: false,
          type: "SELECT_WIDGET",
          version: 1,
          parentId: "0",
          isLoading: false,
          defaultOptionValue: "GREEN",
          parentColumnSpace: 67.375,
          renderMode: RenderModes.CANVAS,
          leftColumn: 1,
          options: [
            {
              label: "Blue",
              value: "BLUE",
            },
            {
              label: "Green",
              value: "GREEN",
            },
            {
              label: "Red",
              value: "RED",
            },
          ],
        },
      ],
    };

    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "Select1",
          rightColumn: 6,
          widgetId: "1e3ytl2pl9",
          topRow: 3,
          bottomRow: 4,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          selectionType: "SINGLE_SELECT",
          type: "SELECT_WIDGET",
          version: 1,
          parentId: "0",
          isLoading: false,
          defaultOptionValue: "GREEN",
          parentColumnSpace: 67.375,
          renderMode: "CANVAS",
          leftColumn: 1,
          options: [
            {
              label: "Blue",
              value: "BLUE",
            },
            {
              label: "Green",
              value: "GREEN",
            },
            {
              label: "Red",
              value: "RED",
            },
          ],
          isRequired: false,
          isDisabled: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("MULTI_SELECT_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Select2",
          rightColumn: 59,
          isFilterable: true,
          widgetId: "zvgz9h4fh4",
          topRow: 10,
          bottomRow: 14,
          parentRowSpace: 10,
          isVisible: true,
          label: "",
          type: "DROP_DOWN_WIDGET",
          version: 1,
          parentId: "0y8sg136kg",
          isLoading: false,
          defaultOptionValue: "GREEN",
          selectionType: "MULTI_SELECT",
          parentColumnSpace: 8.35546875,
          dynamicTriggerPathList: [],
          leftColumn: 39,
          dynamicBindingPathList: [],
          renderMode: RenderModes.CANVAS,
          options: [
            {
              label: "Blue",
              value: "BLUE",
            },
            {
              label: "Green",
              value: "GREEN",
            },
            {
              label: "Red",
              value: "RED",
            },
          ],
        },
      ],
    };

    const output = {
      ...containerWidget,
      children: [
        {
          renderMode: RenderModes.CANVAS,
          type: "MULTI_SELECT_WIDGET",
          widgetName: "Select2",
          rightColumn: 59,
          widgetId: "zvgz9h4fh4",
          topRow: 10,
          bottomRow: 14,
          parentRowSpace: 10,
          isVisible: true,
          label: "",
          version: 1,
          parentId: "0y8sg136kg",
          isLoading: false,
          defaultOptionValue: "GREEN",
          parentColumnSpace: 8.35546875,
          dynamicTriggerPathList: [],
          leftColumn: 39,
          dynamicBindingPathList: [],
          options: [
            {
              label: "Blue",
              value: "BLUE",
            },
            {
              label: "Green",
              value: "GREEN",
            },
            {
              label: "Red",
              value: "RED",
            },
          ],
        },
      ],
    };

    expect(migrateToNewMultiSelect(input)).toEqual(output);
  });

  it("DATE_PICKER_WIDGET2", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "DatePicker1",
          defaultDate: "2021-05-12T06:50:51.743Z",
          rightColumn: 7,
          dateFormat: "YYYY-MM-DD HH:mm",
          widgetId: "5jbfazqnca",
          topRow: 2,
          bottomRow: 3,
          parentRowSpace: 40,
          isVisible: true,
          datePickerType: "DATE_PICKER",
          label: "",
          type: "DATE_PICKER_WIDGET2",
          renderMode: RenderModes.CANVAS,
          version: 2,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 2,
          isDisabled: false,
        },
      ],
    };

    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "DatePicker1",
          defaultDate: "2021-05-12T06:50:51.743Z",
          rightColumn: 7,
          dateFormat: "YYYY-MM-DD HH:mm",
          widgetId: "5jbfazqnca",
          topRow: 2,
          bottomRow: 3,
          parentRowSpace: 40,
          isVisible: true,
          datePickerType: "DATE_PICKER",
          label: "",
          type: "DATE_PICKER_WIDGET2",
          renderMode: RenderModes.CANVAS,
          version: 2,
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 2,
          isDisabled: false,
          // following properties get added
          isRequired: false,
          minDate: "2001-01-01 00:00",
          maxDate: "2041-12-31 23:59",
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("SWITCH_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Switch1",
          rightColumn: 5,
          widgetId: "4ksqurxmwn",
          topRow: 2,
          bottomRow: 3,
          parentRowSpace: 40,
          isVisible: true,
          label: "Label",
          type: "SWITCH_WIDGET",
          renderMode: RenderModes.CANVAS,
          defaultSwitchState: true,
          version: 1,
          alignWidget: "LEFT",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 3,
        },
      ],
    };

    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "Switch1",
          rightColumn: 5,
          widgetId: "4ksqurxmwn",
          topRow: 2,
          bottomRow: 3,
          parentRowSpace: 40,
          isVisible: true,
          label: "Label",
          type: "SWITCH_WIDGET",
          renderMode: RenderModes.CANVAS,
          defaultSwitchState: true,
          version: 1,
          alignWidget: "LEFT",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 3,
          // following properties get added
          isDisabled: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("Video widget", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Video1",
          rightColumn: 9,
          dynamicPropertyPathList: [],
          widgetId: "ti5b5f5hvq",
          topRow: 3,
          bottomRow: 10,
          parentRowSpace: 40,
          isVisible: true,
          type: "VIDEO_WIDGET",
          renderMode: RenderModes.CANVAS,
          version: 1,
          onPlay: "",
          url: "https://assets.appsmith.com/widgets/bird.mp4",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 2,
          autoPlay: false,
        },
      ],
    };
    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "Video1",
          rightColumn: 9,
          dynamicPropertyPathList: [],
          widgetId: "ti5b5f5hvq",
          topRow: 3,
          bottomRow: 10,
          parentRowSpace: 40,
          isVisible: true,
          type: "VIDEO_WIDGET",
          renderMode: RenderModes.CANVAS,
          version: 1,
          onPlay: "",
          url: "https://assets.appsmith.com/widgets/bird.mp4",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 2,
          autoPlay: false,
          // following properties get added
          isRequired: false,
          isDisabled: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("CHECKBOX_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "Checkbox1",
          rightColumn: 8,
          widgetId: "djxhhl1p7t",
          topRow: 4,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "Label",
          type: "CHECKBOX_WIDGET",
          renderMode: RenderModes.CANVAS,
          version: 1,
          alignWidget: "LEFT",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 5,
          defaultCheckedState: true,
        },
      ],
    };
    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "Checkbox1",
          rightColumn: 8,
          widgetId: "djxhhl1p7t",
          topRow: 4,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "Label",
          type: "CHECKBOX_WIDGET",
          renderMode: RenderModes.CANVAS,
          version: 1,
          alignWidget: "LEFT",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 5,
          defaultCheckedState: true,
          // following properties get added
          isDisabled: false,
          isRequired: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("RADIO_GROUP_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "RadioGroup1",
          rightColumn: 5,
          widgetId: "4ixyqnw2no",
          topRow: 3,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          type: "RADIO_GROUP_WIDGET",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentId: "0",
          isLoading: false,
          defaultOptionValue: "Y",
          parentColumnSpace: 67.375,
          leftColumn: 2,
          options: [
            {
              label: "Yes",
              value: "Y",
            },
            {
              label: "No",
              value: "N",
            },
          ],
        },
      ],
    };
    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "RadioGroup1",
          rightColumn: 5,
          widgetId: "4ixyqnw2no",
          topRow: 3,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "",
          type: "RADIO_GROUP_WIDGET",
          renderMode: RenderModes.CANVAS,
          version: 1,
          parentId: "0",
          isLoading: false,
          defaultOptionValue: "Y",
          parentColumnSpace: 67.375,
          leftColumn: 2,
          options: [
            {
              label: "Yes",
              value: "Y",
            },
            {
              label: "No",
              value: "N",
            },
          ],
          // following properties get added
          isDisabled: false,
          isRequired: false,
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });

  it("FILE_PICKER_WIDGET", () => {
    const input = {
      ...containerWidget,
      children: [
        {
          widgetName: "FilePicker1",
          rightColumn: 5,
          isDefaultClickDisabled: true,
          widgetId: "fzajyy8qft",
          topRow: 4,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "Select Files",
          maxFileSize: 5,
          type: "FILE_PICKER_WIDGET",
          renderMode: RenderModes.CANVAS,
          version: 1,
          fileDataType: "Base64",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 1,
          files: [],
          maxNumFiles: 1,
        },
      ],
    };

    const output = {
      ...containerWidget,
      children: [
        {
          widgetName: "FilePicker1",
          rightColumn: 5,
          isDefaultClickDisabled: true,
          widgetId: "fzajyy8qft",
          topRow: 4,
          bottomRow: 5,
          parentRowSpace: 40,
          isVisible: true,
          label: "Select Files",
          maxFileSize: 5,
          type: "FILE_PICKER_WIDGET",
          renderMode: RenderModes.CANVAS,
          version: 1,
          fileDataType: "Base64",
          parentId: "0",
          isLoading: false,
          parentColumnSpace: 67.375,
          leftColumn: 1,
          files: [],
          maxNumFiles: 1,
          // following properties get added
          isDisabled: false,
          isRequired: false,
          allowedFileTypes: [],
        },
      ],
    };

    expect(migrateInitialValues(input)).toEqual(output);
  });
  it("", () => {
    const tabsWidgetDSL: any = (version = 1) => {
      const children: any = buildChildren([
        {
          version,
          type: "TABS_WIDGET",
          children: [
            {
              type: "CANVAS_WIDGET",
              tabId: "tab1212332",
              tabName: "Newly Added Tab",
              widgetId: "o9ody00ep7",
              parentId: "jd83uvbkmp",
              detachFromLayout: true,
              children: [],
              parentRowSpace: 1,
              parentColumnSpace: 1,
              // leftColumn: 0,
              // rightColumn: 592, // Commenting these coz they are not provided for a newly added tab in the Tabs widget version 2
              // bottomRow: 280,
              topRow: 0,
              isLoading: false,
              widgetName: "Canvas1",
              renderMode: "CANVAS",
            },
          ],
        },
      ]);
      const dsl: any = widgetCanvasFactory.build({
        children,
      });
      return {
        data: {
          layouts: [{ dsl }],
        },
      };
    };
    const migratedDslV2: any = extractCurrentDSL(tabsWidgetDSL());
    expect(migratedDslV2.children[0].children[0].leftColumn).toBeNaN();
    const migratedDslV3: any = extractCurrentDSL(tabsWidgetDSL(2));
    expect(migratedDslV3.children[0].version).toBe(3);
    expect(migratedDslV3.children[0].children[0].leftColumn).not.toBeNaN();
    expect(migratedDslV3.children[0].children[0].leftColumn).toBe(0);
  });
});
