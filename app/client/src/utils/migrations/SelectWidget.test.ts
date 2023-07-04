import type { DSLWidget } from "widgets/constants";
import { MigrateSelectTypeWidgetDefaultValue } from "./SelectWidget";

describe("MigrateSelectTypeWidgetDefaultValue", () => {
  describe("Select widget", () => {
    it("should check that defaultOptionValue is migrated when its in old format", () => {
      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "SELECT_WIDGET",
              widgetName: "select",
              defaultOptionValue: "{{moment()}}",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "SELECT_WIDGET",
            widgetName: "select",
            defaultOptionValue:
              "{{ ((options, serverSideFiltering) => ( moment()))(select.options, select.serverSideFiltering) }}",
          },
        ],
      });

      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "SELECT_WIDGET",
              widgetName: "select",
              defaultOptionValue: "{{moment()}}{{moment()}}",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "SELECT_WIDGET",
            widgetName: "select",
            defaultOptionValue:
              "{{ ((options, serverSideFiltering) => ( moment() + moment()))(select.options, select.serverSideFiltering) }}",
          },
        ],
      });
    });

    it("should check that defaultOptionValue is not migrated when its in new format", () => {
      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "SELECT_WIDGET",
              widgetName: "select",
              defaultOptionValue:
                "{{ ((options, serverSideFiltering) => ( moment()))(select.options, select.serverSideFiltering) }}",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "SELECT_WIDGET",
            widgetName: "select",
            defaultOptionValue:
              "{{ ((options, serverSideFiltering) => ( moment()))(select.options, select.serverSideFiltering) }}",
          },
        ],
      });

      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "SELECT_WIDGET",
              widgetName: "select",
              defaultOptionValue:
                "{{ ((options, serverSideFiltering) => ( moment() + moment()))(select.options, select.serverSideFiltering) }}",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "SELECT_WIDGET",
            widgetName: "select",
            defaultOptionValue:
              "{{ ((options, serverSideFiltering) => ( moment() + moment()))(select.options, select.serverSideFiltering) }}",
          },
        ],
      });
    });

    it("should check that defaultOptionValue is not migrated when its a static value", () => {
      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "SELECT_WIDGET",
              widgetName: "select",
              defaultOptionValue: "Green",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "SELECT_WIDGET",
            widgetName: "select",
            defaultOptionValue: "Green",
          },
        ],
      });
    });
  });

  describe("Multi Select widget", () => {
    it("should check that defaultOptionValue is migrated when its in old format", () => {
      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "MULTI_SELECT_WIDGET_V2",
              widgetName: "select",
              defaultOptionValue: "{{[moment()]}}",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "MULTI_SELECT_WIDGET_V2",
            widgetName: "select",
            defaultOptionValue:
              "{{ ((options, serverSideFiltering) => ( [moment()]))(select.options, select.serverSideFiltering) }}",
          },
        ],
      });

      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "MULTI_SELECT_WIDGET_V2",
              widgetName: "select",
              defaultOptionValue: "{{moment()}}{{moment()}}",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "MULTI_SELECT_WIDGET_V2",
            widgetName: "select",
            defaultOptionValue:
              "{{ ((options, serverSideFiltering) => ( moment() + moment()))(select.options, select.serverSideFiltering) }}",
          },
        ],
      });
    });

    it("should check that defaultOptionValue is not migrated when its in new format", () => {
      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "MULTI_SELECT_WIDGET_V2",
              widgetName: "select",
              defaultOptionValue:
                "{{ ((options, serverSideFiltering) => ( [moment()]))(select.options, select.serverSideFiltering) }}",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "MULTI_SELECT_WIDGET_V2",
            widgetName: "select",
            defaultOptionValue:
              "{{ ((options, serverSideFiltering) => ( [moment()]))(select.options, select.serverSideFiltering) }}",
          },
        ],
      });

      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "MULTI_SELECT_WIDGET_V2",
              widgetName: "select",
              defaultOptionValue:
                "{{ ((options, serverSideFiltering) => ( moment() + moment()))(select.options, select.serverSideFiltering) }}",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "MULTI_SELECT_WIDGET_V2",
            widgetName: "select",
            defaultOptionValue:
              "{{ ((options, serverSideFiltering) => ( moment() + moment()))(select.options, select.serverSideFiltering) }}",
          },
        ],
      });
    });

    it("should check that defaultOptionValue is not migrated when its a static value", () => {
      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "MULTI_SELECT_WIDGET_V2",
              widgetName: "select",
              defaultOptionValue: "[Green]",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "MULTI_SELECT_WIDGET_V2",
            widgetName: "select",
            defaultOptionValue: "[Green]",
          },
        ],
      });
    });

    expect(
      MigrateSelectTypeWidgetDefaultValue({
        children: [
          {
            type: "MULTI_SELECT_WIDGET_V2",
            widgetName: "select",
            defaultOptionValue: ["Green"],
          },
        ],
      } as any as DSLWidget),
    ).toEqual({
      children: [
        {
          type: "MULTI_SELECT_WIDGET_V2",
          widgetName: "select",
          defaultOptionValue: ["Green"],
        },
      ],
    });
  });

  describe("other widget", () => {
    it("should left untouched", () => {
      expect(
        MigrateSelectTypeWidgetDefaultValue({
          children: [
            {
              type: "TABLE_WIDGET",
              widgetName: "select",
              defaultOptionValue: "{{[moment()]}}",
            },
          ],
        } as any as DSLWidget),
      ).toEqual({
        children: [
          {
            type: "TABLE_WIDGET",
            widgetName: "select",
            defaultOptionValue: "{{[moment()]}}",
          },
        ],
      });
    });
  });

  it("should check that its not touching the dsl tree structure", () => {
    const input = {
      widgetName: "MainContainer",
      backgroundColor: "none",
      rightColumn: 4896,
      snapColumns: 64,
      detachFromLayout: true,
      widgetId: "0",
      topRow: 0,
      bottomRow: 900,
      containerStyle: "none",
      snapRows: 125,
      parentRowSpace: 1,
      type: "CANVAS_WIDGET",
      canExtend: true,
      version: 61,
      minHeight: 1292,
      dynamicTriggerPathList: [],
      parentColumnSpace: 1,
      dynamicBindingPathList: [],
      leftColumn: 0,
      children: [
        {
          boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          widgetName: "Table1",
          defaultPageSize: 0,
          columnOrder: ["step", "task", "status", "action"],
          dynamicPropertyPathList: [],
          isVisibleDownload: true,
          displayName: "Table",
          iconSVG: "/static/media/icon.db8a9cbd2acd22a31ea91cc37ea2a46c.svg",
          topRow: 2,
          bottomRow: 30,
          columnWidthMap: {
            task: 245,
            step: 62,
            status: 75,
          },
          isSortable: true,
          parentRowSpace: 10,
          type: "TABLE_WIDGET_V2",
          hideCard: false,
          inlineEditingSaveOption: "ROW_LEVEL",
          animateLoading: true,
          parentColumnSpace: 20.0625,
          dynamicBindingPathList: [
            {
              key: "primaryColumns.step.computedValue",
            },
            {
              key: "primaryColumns.task.computedValue",
            },
            {
              key: "primaryColumns.status.computedValue",
            },
            {
              key: "primaryColumns.action.computedValue",
            },
            {
              key: "primaryColumns.action.buttonColor",
            },
            {
              key: "primaryColumns.action.borderRadius",
            },
            {
              key: "primaryColumns.action.boxShadow",
            },
            {
              key: "accentColor",
            },
            {
              key: "borderRadius",
            },
            {
              key: "boxShadow",
            },
            {
              key: "childStylesheet.button.buttonColor",
            },
            {
              key: "childStylesheet.button.borderRadius",
            },
            {
              key: "childStylesheet.menuButton.menuColor",
            },
            {
              key: "childStylesheet.menuButton.borderRadius",
            },
            {
              key: "childStylesheet.iconButton.buttonColor",
            },
            {
              key: "childStylesheet.iconButton.borderRadius",
            },
            {
              key: "childStylesheet.editActions.saveButtonColor",
            },
            {
              key: "childStylesheet.editActions.saveBorderRadius",
            },
            {
              key: "childStylesheet.editActions.discardButtonColor",
            },
            {
              key: "childStylesheet.editActions.discardBorderRadius",
            },
          ],
          leftColumn: 5,
          primaryColumns: {
            step: {
              index: 0,
              width: 150,
              id: "step",
              originalId: "step",
              alias: "step",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textSize: "0.875rem",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isCellVisible: true,
              isCellEditable: false,
              isDerived: false,
              label: "step",
              computedValue:
                '{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["step"]))}}',
              validation: {},
              labelColor: "#FFFFFF",
            },
            task: {
              index: 1,
              width: 150,
              id: "task",
              originalId: "task",
              alias: "task",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textSize: "0.875rem",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isCellVisible: true,
              isCellEditable: false,
              isDerived: false,
              label: "task",
              computedValue:
                '{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["task"]))}}',
              validation: {},
              labelColor: "#FFFFFF",
            },
            status: {
              index: 2,
              width: 150,
              id: "status",
              originalId: "status",
              alias: "status",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textSize: "0.875rem",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isCellVisible: true,
              isCellEditable: false,
              isDerived: false,
              label: "status",
              computedValue:
                '{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["status"]))}}',
              validation: {},
              labelColor: "#FFFFFF",
            },
            action: {
              index: 3,
              width: 150,
              id: "action",
              originalId: "action",
              alias: "action",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "button",
              textSize: "0.875rem",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isCellVisible: true,
              isCellEditable: false,
              isDisabled: false,
              isDerived: false,
              label: "action",
              onClick:
                "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
              computedValue:
                '{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["action"]))}}',
              validation: {},
              labelColor: "#FFFFFF",
              buttonColor:
                "{{Table1.processedTableData.map((currentRow, currentIndex) => ( appsmith.theme.colors.primaryColor))}}",
              borderRadius:
                "{{Table1.processedTableData.map((currentRow, currentIndex) => ( appsmith.theme.borderRadius.appBorderRadius))}}",
              boxShadow:
                "{{Table1.processedTableData.map((currentRow, currentIndex) => ( 'none'))}}",
            },
          },
          delimiter: ",",
          defaultSelectedRowIndex: 0,
          key: "11yw1d4v89",
          isDeprecated: false,
          rightColumn: 39,
          textSize: "0.875rem",
          widgetId: "154ekmu25d",
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          isVisibleFilters: true,
          tableData: [
            {
              step: "#1",
              task: "Drop a table",
              status: "✅",
              action: "",
            },
            {
              step: "#2",
              task: "Create a query fetch_users with the Mock DB",
              status: "--",
              action: "",
            },
            {
              step: "#3",
              task: "Bind the query using => fetch_users.data",
              status: "--",
              action: "",
            },
          ],
          isVisible: true,
          label: "Data",
          searchKey: "",
          enableClientSideSearch: true,
          version: 1,
          totalRecordsCount: 0,
          parentId: "0",
          renderMode: "CANVAS",
          isLoading: false,
          horizontalAlignment: "LEFT",
          isVisibleSearch: true,
          childStylesheet: {
            button: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            menuButton: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            iconButton: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            editActions: {
              saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              saveBorderRadius:
                "{{appsmith.theme.borderRadius.appBorderRadius}}",
              discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              discardBorderRadius:
                "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
          },
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          isVisiblePagination: true,
          defaultSelectedRowIndices: [0],
          verticalAlignment: "CENTER",
        },
        {
          boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          widgetName: "Container1",
          borderColor: "transparent",
          isCanvas: true,
          displayName: "Container",
          iconSVG: "/static/media/icon.1977dca3370505e2db3a8e44cfd54907.svg",
          searchTags: ["div", "parent", "group"],
          topRow: 33,
          bottomRow: 88,
          parentRowSpace: 10,
          type: "CONTAINER_WIDGET",
          hideCard: false,
          animateLoading: true,
          parentColumnSpace: 20.0625,
          leftColumn: 5,
          dynamicBindingPathList: [
            {
              key: "borderRadius",
            },
            {
              key: "boxShadow",
            },
          ],
          children: [
            {
              boxShadow: "none",
              widgetName: "Canvas1",
              displayName: "Canvas",
              topRow: 0,
              bottomRow: 530,
              parentRowSpace: 1,
              type: "CANVAS_WIDGET",
              canExtend: false,
              hideCard: true,
              minHeight: 400,
              parentColumnSpace: 1,
              leftColumn: 0,
              dynamicBindingPathList: [
                {
                  key: "borderRadius",
                },
                {
                  key: "accentColor",
                },
              ],
              children: [
                {
                  boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
                  widgetName: "Form1",
                  isCanvas: true,
                  displayName: "Form",
                  iconSVG:
                    "/static/media/icon.ea3e08d130e59c56867ae40114c10eed.svg",
                  searchTags: ["group"],
                  topRow: 2,
                  bottomRow: 42,
                  parentRowSpace: 10,
                  type: "FORM_WIDGET",
                  hideCard: false,
                  animateLoading: true,
                  parentColumnSpace: 10.345703125,
                  leftColumn: 4,
                  dynamicBindingPathList: [
                    {
                      key: "borderRadius",
                    },
                    {
                      key: "boxShadow",
                    },
                  ],
                  children: [
                    {
                      boxShadow: "none",
                      widgetName: "Canvas2",
                      displayName: "Canvas",
                      topRow: 0,
                      bottomRow: 390,
                      parentRowSpace: 1,
                      type: "CANVAS_WIDGET",
                      canExtend: false,
                      hideCard: true,
                      minHeight: 400,
                      parentColumnSpace: 1,
                      leftColumn: 0,
                      dynamicBindingPathList: [
                        {
                          key: "borderRadius",
                        },
                        {
                          key: "accentColor",
                        },
                      ],
                      children: [
                        {
                          widgetName: "Text1",
                          displayName: "Text",
                          iconSVG:
                            "/static/media/icon.97c59b523e6f70ba6f40a10fc2c7c5b5.svg",
                          searchTags: ["typography", "paragraph", "label"],
                          topRow: 1,
                          bottomRow: 5,
                          type: "TEXT_WIDGET",
                          hideCard: false,
                          animateLoading: true,
                          overflow: "NONE",
                          fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
                          leftColumn: 1.5,
                          dynamicBindingPathList: [
                            {
                              key: "fontFamily",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          shouldTruncate: false,
                          truncateButtonColor: "#FFC13D",
                          text: "Form",
                          key: "5rfbzu1cpv",
                          isDeprecated: false,
                          rightColumn: 25.5,
                          textAlign: "LEFT",
                          widgetId: "c6xgdbotnb",
                          isVisible: true,
                          fontStyle: "BOLD",
                          textColor: "#231F20",
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          renderMode: "CANVAS",
                          isLoading: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                          fontSize: "1.25rem",
                        },
                        {
                          resetFormOnClick: true,
                          boxShadow: "none",
                          widgetName: "Button1",
                          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                          displayName: "Button",
                          iconSVG:
                            "/static/media/icon.cca026338f1c8eb6df8ba03d084c2fca.svg",
                          searchTags: ["click", "submit"],
                          topRow: 33,
                          bottomRow: 37,
                          type: "BUTTON_WIDGET",
                          hideCard: false,
                          animateLoading: true,
                          leftColumn: 46,
                          dynamicBindingPathList: [
                            {
                              key: "buttonColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          text: "Submit",
                          isDisabled: false,
                          key: "v5rdaw9rk9",
                          isDeprecated: false,
                          rightColumn: 62,
                          isDefaultClickDisabled: true,
                          widgetId: "ezkuystufr",
                          isVisible: true,
                          recaptchaType: "V3",
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          renderMode: "CANVAS",
                          isLoading: false,
                          disabledWhenInvalid: true,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                          buttonVariant: "PRIMARY",
                          placement: "CENTER",
                        },
                        {
                          resetFormOnClick: true,
                          boxShadow: "none",
                          widgetName: "Button2",
                          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                          displayName: "Button",
                          iconSVG:
                            "/static/media/icon.cca026338f1c8eb6df8ba03d084c2fca.svg",
                          searchTags: ["click", "submit"],
                          topRow: 33,
                          bottomRow: 37,
                          type: "BUTTON_WIDGET",
                          hideCard: false,
                          animateLoading: true,
                          leftColumn: 30,
                          dynamicBindingPathList: [
                            {
                              key: "buttonColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          text: "Reset",
                          isDisabled: false,
                          key: "v5rdaw9rk9",
                          isDeprecated: false,
                          rightColumn: 46,
                          isDefaultClickDisabled: true,
                          widgetId: "8zd8nvk2fs",
                          isVisible: true,
                          recaptchaType: "V3",
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          renderMode: "CANVAS",
                          isLoading: false,
                          disabledWhenInvalid: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                          buttonVariant: "SECONDARY",
                          placement: "CENTER",
                        },
                        {
                          boxShadow: "none",
                          widgetName: "Input1",
                          displayName: "Input",
                          iconSVG:
                            "/static/media/icon.9f505595da61a34f563dba82adeb06ec.svg",
                          searchTags: [
                            "form",
                            "text input",
                            "number",
                            "textarea",
                          ],
                          topRow: 7,
                          bottomRow: 11,
                          parentRowSpace: 10,
                          labelWidth: 5,
                          autoFocus: false,
                          type: "INPUT_WIDGET_V2",
                          hideCard: false,
                          animateLoading: true,
                          parentColumnSpace: 8.578338623046875,
                          resetOnSubmit: true,
                          leftColumn: 1,
                          dynamicBindingPathList: [
                            {
                              key: "accentColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          labelPosition: "Left",
                          labelStyle: "",
                          inputType: "TEXT",
                          isDisabled: false,
                          key: "mk8njmq8tm",
                          labelTextSize: "0.875rem",
                          isRequired: false,
                          isDeprecated: false,
                          rightColumn: 21,
                          widgetId: "4emr5oa46o",
                          accentColor: "{{appsmith.theme.colors.primaryColor}}",
                          isVisible: true,
                          label: "Label",
                          version: 2,
                          parentId: "a4yu9qdsd3",
                          labelAlignment: "left",
                          renderMode: "CANVAS",
                          isLoading: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                          iconAlign: "left",
                          defaultText: "",
                        },
                        {
                          boxShadow: "none",
                          widgetName: "Select1",
                          isFilterable: true,
                          displayName: "Select",
                          iconSVG:
                            "/static/media/icon.bd99caba5853ad71e4b3d8daffacb3a2.svg",
                          labelText: "Label",
                          searchTags: ["dropdown"],
                          topRow: 14,
                          bottomRow: 18,
                          parentRowSpace: 10,
                          labelWidth: 5,
                          type: "SELECT_WIDGET",
                          serverSideFiltering: false,
                          hideCard: false,
                          defaultOptionValue: "{{moment()}}",
                          animateLoading: true,
                          parentColumnSpace: 8.578338623046875,
                          leftColumn: 0,
                          dynamicBindingPathList: [
                            {
                              key: "accentColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          labelPosition: "Left",
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
                          placeholderText: "Select option",
                          isDisabled: false,
                          key: "3m7x2hnrkc",
                          labelTextSize: "0.875rem",
                          isRequired: false,
                          isDeprecated: false,
                          rightColumn: 20,
                          widgetId: "6awuifuxy3",
                          accentColor: "{{appsmith.theme.colors.primaryColor}}",
                          isVisible: true,
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          labelAlignment: "left",
                          renderMode: "CANVAS",
                          isLoading: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                        },
                        {
                          boxShadow: "none",
                          widgetName: "MultiSelect1",
                          isFilterable: true,
                          displayName: "MultiSelect",
                          iconSVG:
                            "/static/media/icon.a3495809ae48291a64404f3bb04b0e69.svg",
                          labelText: "Label",
                          searchTags: ["dropdown", "tags"],
                          topRow: 21,
                          bottomRow: 25,
                          parentRowSpace: 10,
                          labelWidth: 5,
                          type: "MULTI_SELECT_WIDGET_V2",
                          serverSideFiltering: false,
                          hideCard: false,
                          defaultOptionValue: "{{[moment()]}}",
                          animateLoading: true,
                          parentColumnSpace: 8.578338623046875,
                          leftColumn: 0,
                          dynamicBindingPathList: [
                            {
                              key: "accentColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          labelPosition: "Left",
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
                          placeholderText: "Select option(s)",
                          isDisabled: false,
                          key: "hzfum4zki4",
                          labelTextSize: "0.875rem",
                          isRequired: false,
                          isDeprecated: false,
                          rightColumn: 23,
                          widgetId: "4gtzutx5cm",
                          accentColor: "{{appsmith.theme.colors.primaryColor}}",
                          isVisible: true,
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          labelAlignment: "left",
                          renderMode: "CANVAS",
                          isLoading: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                        },
                      ],
                      key: "2vj82fyk6w",
                      isDeprecated: false,
                      rightColumn: 248.296875,
                      detachFromLayout: true,
                      widgetId: "a4yu9qdsd3",
                      accentColor: "{{appsmith.theme.colors.primaryColor}}",
                      containerStyle: "none",
                      isVisible: true,
                      version: 1,
                      parentId: "quvculga8z",
                      renderMode: "CANVAS",
                      isLoading: false,
                      borderRadius:
                        "{{appsmith.theme.borderRadius.appBorderRadius}}",
                    },
                  ],
                  key: "64fkw5w3ne",
                  backgroundColor: "#FFFFFF",
                  isDeprecated: false,
                  rightColumn: 59,
                  widgetId: "quvculga8z",
                  isVisible: true,
                  parentId: "hfab4ag2fr",
                  renderMode: "CANVAS",
                  isLoading: false,
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                {
                  widgetName: "Text2",
                  displayName: "Text",
                  iconSVG:
                    "/static/media/icon.97c59b523e6f70ba6f40a10fc2c7c5b5.svg",
                  searchTags: ["typography", "paragraph", "label"],
                  topRow: 45,
                  bottomRow: 51,
                  parentRowSpace: 10,
                  type: "TEXT_WIDGET",
                  hideCard: false,
                  animateLoading: true,
                  overflow: "NONE",
                  fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
                  parentColumnSpace: 10.345703125,
                  leftColumn: 12,
                  dynamicBindingPathList: [
                    {
                      key: "fontFamily",
                    },
                    {
                      key: "borderRadius",
                    },
                  ],
                  shouldTruncate: false,
                  truncateButtonColor: "#FFC13D",
                  text: "Label",
                  key: "xosgai8vfh",
                  isDeprecated: false,
                  rightColumn: 51,
                  textAlign: "LEFT",
                  widgetId: "i5t134gcz2",
                  isVisible: true,
                  fontStyle: "BOLD",
                  textColor: "#231F20",
                  version: 1,
                  parentId: "hfab4ag2fr",
                  renderMode: "CANVAS",
                  isLoading: false,
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  fontSize: "1rem",
                },
              ],
              key: "du5dxsnp7w",
              isDeprecated: false,
              rightColumn: 481.5,
              detachFromLayout: true,
              widgetId: "hfab4ag2fr",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              containerStyle: "none",
              isVisible: true,
              version: 1,
              parentId: "3zdzo27neb",
              renderMode: "CANVAS",
              isLoading: false,
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
          ],
          borderWidth: "0",
          key: "y2bj1fyd3j",
          backgroundColor: "#FFFFFF",
          isDeprecated: false,
          rightColumn: 39,
          widgetId: "3zdzo27neb",
          containerStyle: "card",
          isVisible: true,
          version: 1,
          parentId: "0",
          renderMode: "CANVAS",
          isLoading: false,
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        },
      ],
    };

    const output = {
      widgetName: "MainContainer",
      backgroundColor: "none",
      rightColumn: 4896,
      snapColumns: 64,
      detachFromLayout: true,
      widgetId: "0",
      topRow: 0,
      bottomRow: 900,
      containerStyle: "none",
      snapRows: 125,
      parentRowSpace: 1,
      type: "CANVAS_WIDGET",
      canExtend: true,
      version: 61,
      minHeight: 1292,
      dynamicTriggerPathList: [],
      parentColumnSpace: 1,
      dynamicBindingPathList: [],
      leftColumn: 0,
      children: [
        {
          boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          widgetName: "Table1",
          defaultPageSize: 0,
          columnOrder: ["step", "task", "status", "action"],
          dynamicPropertyPathList: [],
          isVisibleDownload: true,
          displayName: "Table",
          iconSVG: "/static/media/icon.db8a9cbd2acd22a31ea91cc37ea2a46c.svg",
          topRow: 2,
          bottomRow: 30,
          columnWidthMap: {
            task: 245,
            step: 62,
            status: 75,
          },
          isSortable: true,
          parentRowSpace: 10,
          type: "TABLE_WIDGET_V2",
          hideCard: false,
          inlineEditingSaveOption: "ROW_LEVEL",
          animateLoading: true,
          parentColumnSpace: 20.0625,
          dynamicBindingPathList: [
            {
              key: "primaryColumns.step.computedValue",
            },
            {
              key: "primaryColumns.task.computedValue",
            },
            {
              key: "primaryColumns.status.computedValue",
            },
            {
              key: "primaryColumns.action.computedValue",
            },
            {
              key: "primaryColumns.action.buttonColor",
            },
            {
              key: "primaryColumns.action.borderRadius",
            },
            {
              key: "primaryColumns.action.boxShadow",
            },
            {
              key: "accentColor",
            },
            {
              key: "borderRadius",
            },
            {
              key: "boxShadow",
            },
            {
              key: "childStylesheet.button.buttonColor",
            },
            {
              key: "childStylesheet.button.borderRadius",
            },
            {
              key: "childStylesheet.menuButton.menuColor",
            },
            {
              key: "childStylesheet.menuButton.borderRadius",
            },
            {
              key: "childStylesheet.iconButton.buttonColor",
            },
            {
              key: "childStylesheet.iconButton.borderRadius",
            },
            {
              key: "childStylesheet.editActions.saveButtonColor",
            },
            {
              key: "childStylesheet.editActions.saveBorderRadius",
            },
            {
              key: "childStylesheet.editActions.discardButtonColor",
            },
            {
              key: "childStylesheet.editActions.discardBorderRadius",
            },
          ],
          leftColumn: 5,
          primaryColumns: {
            step: {
              index: 0,
              width: 150,
              id: "step",
              originalId: "step",
              alias: "step",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textSize: "0.875rem",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isCellVisible: true,
              isCellEditable: false,
              isDerived: false,
              label: "step",
              computedValue:
                '{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["step"]))}}',
              validation: {},
              labelColor: "#FFFFFF",
            },
            task: {
              index: 1,
              width: 150,
              id: "task",
              originalId: "task",
              alias: "task",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textSize: "0.875rem",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isCellVisible: true,
              isCellEditable: false,
              isDerived: false,
              label: "task",
              computedValue:
                '{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["task"]))}}',
              validation: {},
              labelColor: "#FFFFFF",
            },
            status: {
              index: 2,
              width: 150,
              id: "status",
              originalId: "status",
              alias: "status",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "text",
              textSize: "0.875rem",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isCellVisible: true,
              isCellEditable: false,
              isDerived: false,
              label: "status",
              computedValue:
                '{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["status"]))}}',
              validation: {},
              labelColor: "#FFFFFF",
            },
            action: {
              index: 3,
              width: 150,
              id: "action",
              originalId: "action",
              alias: "action",
              horizontalAlignment: "LEFT",
              verticalAlignment: "CENTER",
              columnType: "button",
              textSize: "0.875rem",
              enableFilter: true,
              enableSort: true,
              isVisible: true,
              isCellVisible: true,
              isCellEditable: false,
              isDisabled: false,
              isDerived: false,
              label: "action",
              onClick:
                "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
              computedValue:
                '{{Table1.processedTableData.map((currentRow, currentIndex) => ( currentRow["action"]))}}',
              validation: {},
              labelColor: "#FFFFFF",
              buttonColor:
                "{{Table1.processedTableData.map((currentRow, currentIndex) => ( appsmith.theme.colors.primaryColor))}}",
              borderRadius:
                "{{Table1.processedTableData.map((currentRow, currentIndex) => ( appsmith.theme.borderRadius.appBorderRadius))}}",
              boxShadow:
                "{{Table1.processedTableData.map((currentRow, currentIndex) => ( 'none'))}}",
            },
          },
          delimiter: ",",
          defaultSelectedRowIndex: 0,
          key: "11yw1d4v89",
          isDeprecated: false,
          rightColumn: 39,
          textSize: "0.875rem",
          widgetId: "154ekmu25d",
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          isVisibleFilters: true,
          tableData: [
            {
              step: "#1",
              task: "Drop a table",
              status: "✅",
              action: "",
            },
            {
              step: "#2",
              task: "Create a query fetch_users with the Mock DB",
              status: "--",
              action: "",
            },
            {
              step: "#3",
              task: "Bind the query using => fetch_users.data",
              status: "--",
              action: "",
            },
          ],
          isVisible: true,
          label: "Data",
          searchKey: "",
          enableClientSideSearch: true,
          version: 1,
          totalRecordsCount: 0,
          parentId: "0",
          renderMode: "CANVAS",
          isLoading: false,
          horizontalAlignment: "LEFT",
          isVisibleSearch: true,
          childStylesheet: {
            button: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            menuButton: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            iconButton: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            editActions: {
              saveButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              saveBorderRadius:
                "{{appsmith.theme.borderRadius.appBorderRadius}}",
              discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              discardBorderRadius:
                "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
          },
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          isVisiblePagination: true,
          defaultSelectedRowIndices: [0],
          verticalAlignment: "CENTER",
        },
        {
          boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          widgetName: "Container1",
          borderColor: "transparent",
          isCanvas: true,
          displayName: "Container",
          iconSVG: "/static/media/icon.1977dca3370505e2db3a8e44cfd54907.svg",
          searchTags: ["div", "parent", "group"],
          topRow: 33,
          bottomRow: 88,
          parentRowSpace: 10,
          type: "CONTAINER_WIDGET",
          hideCard: false,
          animateLoading: true,
          parentColumnSpace: 20.0625,
          leftColumn: 5,
          dynamicBindingPathList: [
            {
              key: "borderRadius",
            },
            {
              key: "boxShadow",
            },
          ],
          children: [
            {
              boxShadow: "none",
              widgetName: "Canvas1",
              displayName: "Canvas",
              topRow: 0,
              bottomRow: 530,
              parentRowSpace: 1,
              type: "CANVAS_WIDGET",
              canExtend: false,
              hideCard: true,
              minHeight: 400,
              parentColumnSpace: 1,
              leftColumn: 0,
              dynamicBindingPathList: [
                {
                  key: "borderRadius",
                },
                {
                  key: "accentColor",
                },
              ],
              children: [
                {
                  boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
                  widgetName: "Form1",
                  isCanvas: true,
                  displayName: "Form",
                  iconSVG:
                    "/static/media/icon.ea3e08d130e59c56867ae40114c10eed.svg",
                  searchTags: ["group"],
                  topRow: 2,
                  bottomRow: 42,
                  parentRowSpace: 10,
                  type: "FORM_WIDGET",
                  hideCard: false,
                  animateLoading: true,
                  parentColumnSpace: 10.345703125,
                  leftColumn: 4,
                  dynamicBindingPathList: [
                    {
                      key: "borderRadius",
                    },
                    {
                      key: "boxShadow",
                    },
                  ],
                  children: [
                    {
                      boxShadow: "none",
                      widgetName: "Canvas2",
                      displayName: "Canvas",
                      topRow: 0,
                      bottomRow: 390,
                      parentRowSpace: 1,
                      type: "CANVAS_WIDGET",
                      canExtend: false,
                      hideCard: true,
                      minHeight: 400,
                      parentColumnSpace: 1,
                      leftColumn: 0,
                      dynamicBindingPathList: [
                        {
                          key: "borderRadius",
                        },
                        {
                          key: "accentColor",
                        },
                      ],
                      children: [
                        {
                          widgetName: "Text1",
                          displayName: "Text",
                          iconSVG:
                            "/static/media/icon.97c59b523e6f70ba6f40a10fc2c7c5b5.svg",
                          searchTags: ["typography", "paragraph", "label"],
                          topRow: 1,
                          bottomRow: 5,
                          type: "TEXT_WIDGET",
                          hideCard: false,
                          animateLoading: true,
                          overflow: "NONE",
                          fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
                          leftColumn: 1.5,
                          dynamicBindingPathList: [
                            {
                              key: "fontFamily",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          shouldTruncate: false,
                          truncateButtonColor: "#FFC13D",
                          text: "Form",
                          key: "5rfbzu1cpv",
                          isDeprecated: false,
                          rightColumn: 25.5,
                          textAlign: "LEFT",
                          widgetId: "c6xgdbotnb",
                          isVisible: true,
                          fontStyle: "BOLD",
                          textColor: "#231F20",
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          renderMode: "CANVAS",
                          isLoading: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                          fontSize: "1.25rem",
                        },
                        {
                          resetFormOnClick: true,
                          boxShadow: "none",
                          widgetName: "Button1",
                          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                          displayName: "Button",
                          iconSVG:
                            "/static/media/icon.cca026338f1c8eb6df8ba03d084c2fca.svg",
                          searchTags: ["click", "submit"],
                          topRow: 33,
                          bottomRow: 37,
                          type: "BUTTON_WIDGET",
                          hideCard: false,
                          animateLoading: true,
                          leftColumn: 46,
                          dynamicBindingPathList: [
                            {
                              key: "buttonColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          text: "Submit",
                          isDisabled: false,
                          key: "v5rdaw9rk9",
                          isDeprecated: false,
                          rightColumn: 62,
                          isDefaultClickDisabled: true,
                          widgetId: "ezkuystufr",
                          isVisible: true,
                          recaptchaType: "V3",
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          renderMode: "CANVAS",
                          isLoading: false,
                          disabledWhenInvalid: true,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                          buttonVariant: "PRIMARY",
                          placement: "CENTER",
                        },
                        {
                          resetFormOnClick: true,
                          boxShadow: "none",
                          widgetName: "Button2",
                          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                          displayName: "Button",
                          iconSVG:
                            "/static/media/icon.cca026338f1c8eb6df8ba03d084c2fca.svg",
                          searchTags: ["click", "submit"],
                          topRow: 33,
                          bottomRow: 37,
                          type: "BUTTON_WIDGET",
                          hideCard: false,
                          animateLoading: true,
                          leftColumn: 30,
                          dynamicBindingPathList: [
                            {
                              key: "buttonColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          text: "Reset",
                          isDisabled: false,
                          key: "v5rdaw9rk9",
                          isDeprecated: false,
                          rightColumn: 46,
                          isDefaultClickDisabled: true,
                          widgetId: "8zd8nvk2fs",
                          isVisible: true,
                          recaptchaType: "V3",
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          renderMode: "CANVAS",
                          isLoading: false,
                          disabledWhenInvalid: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                          buttonVariant: "SECONDARY",
                          placement: "CENTER",
                        },
                        {
                          boxShadow: "none",
                          widgetName: "Input1",
                          displayName: "Input",
                          iconSVG:
                            "/static/media/icon.9f505595da61a34f563dba82adeb06ec.svg",
                          searchTags: [
                            "form",
                            "text input",
                            "number",
                            "textarea",
                          ],
                          topRow: 7,
                          bottomRow: 11,
                          parentRowSpace: 10,
                          labelWidth: 5,
                          autoFocus: false,
                          type: "INPUT_WIDGET_V2",
                          hideCard: false,
                          animateLoading: true,
                          parentColumnSpace: 8.578338623046875,
                          resetOnSubmit: true,
                          leftColumn: 1,
                          dynamicBindingPathList: [
                            {
                              key: "accentColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          labelPosition: "Left",
                          labelStyle: "",
                          inputType: "TEXT",
                          isDisabled: false,
                          key: "mk8njmq8tm",
                          labelTextSize: "0.875rem",
                          isRequired: false,
                          isDeprecated: false,
                          rightColumn: 21,
                          widgetId: "4emr5oa46o",
                          accentColor: "{{appsmith.theme.colors.primaryColor}}",
                          isVisible: true,
                          label: "Label",
                          version: 2,
                          parentId: "a4yu9qdsd3",
                          labelAlignment: "left",
                          renderMode: "CANVAS",
                          isLoading: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                          iconAlign: "left",
                          defaultText: "",
                        },
                        {
                          boxShadow: "none",
                          widgetName: "Select1",
                          isFilterable: true,
                          displayName: "Select",
                          iconSVG:
                            "/static/media/icon.bd99caba5853ad71e4b3d8daffacb3a2.svg",
                          labelText: "Label",
                          searchTags: ["dropdown"],
                          topRow: 14,
                          bottomRow: 18,
                          parentRowSpace: 10,
                          labelWidth: 5,
                          type: "SELECT_WIDGET",
                          serverSideFiltering: false,
                          hideCard: false,
                          defaultOptionValue:
                            "{{ ((options, serverSideFiltering) => ( moment()))(Select1.options, Select1.serverSideFiltering) }}",
                          animateLoading: true,
                          parentColumnSpace: 8.578338623046875,
                          leftColumn: 0,
                          dynamicBindingPathList: [
                            {
                              key: "accentColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          labelPosition: "Left",
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
                          placeholderText: "Select option",
                          isDisabled: false,
                          key: "3m7x2hnrkc",
                          labelTextSize: "0.875rem",
                          isRequired: false,
                          isDeprecated: false,
                          rightColumn: 20,
                          widgetId: "6awuifuxy3",
                          accentColor: "{{appsmith.theme.colors.primaryColor}}",
                          isVisible: true,
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          labelAlignment: "left",
                          renderMode: "CANVAS",
                          isLoading: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                        },
                        {
                          boxShadow: "none",
                          widgetName: "MultiSelect1",
                          isFilterable: true,
                          displayName: "MultiSelect",
                          iconSVG:
                            "/static/media/icon.a3495809ae48291a64404f3bb04b0e69.svg",
                          labelText: "Label",
                          searchTags: ["dropdown", "tags"],
                          topRow: 21,
                          bottomRow: 25,
                          parentRowSpace: 10,
                          labelWidth: 5,
                          type: "MULTI_SELECT_WIDGET_V2",
                          serverSideFiltering: false,
                          hideCard: false,
                          defaultOptionValue:
                            "{{ ((options, serverSideFiltering) => ( [moment()]))(MultiSelect1.options, MultiSelect1.serverSideFiltering) }}",
                          animateLoading: true,
                          parentColumnSpace: 8.578338623046875,
                          leftColumn: 0,
                          dynamicBindingPathList: [
                            {
                              key: "accentColor",
                            },
                            {
                              key: "borderRadius",
                            },
                          ],
                          labelPosition: "Left",
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
                          placeholderText: "Select option(s)",
                          isDisabled: false,
                          key: "hzfum4zki4",
                          labelTextSize: "0.875rem",
                          isRequired: false,
                          isDeprecated: false,
                          rightColumn: 23,
                          widgetId: "4gtzutx5cm",
                          accentColor: "{{appsmith.theme.colors.primaryColor}}",
                          isVisible: true,
                          version: 1,
                          parentId: "a4yu9qdsd3",
                          labelAlignment: "left",
                          renderMode: "CANVAS",
                          isLoading: false,
                          borderRadius:
                            "{{appsmith.theme.borderRadius.appBorderRadius}}",
                        },
                      ],
                      key: "2vj82fyk6w",
                      isDeprecated: false,
                      rightColumn: 248.296875,
                      detachFromLayout: true,
                      widgetId: "a4yu9qdsd3",
                      accentColor: "{{appsmith.theme.colors.primaryColor}}",
                      containerStyle: "none",
                      isVisible: true,
                      version: 1,
                      parentId: "quvculga8z",
                      renderMode: "CANVAS",
                      isLoading: false,
                      borderRadius:
                        "{{appsmith.theme.borderRadius.appBorderRadius}}",
                    },
                  ],
                  key: "64fkw5w3ne",
                  backgroundColor: "#FFFFFF",
                  isDeprecated: false,
                  rightColumn: 59,
                  widgetId: "quvculga8z",
                  isVisible: true,
                  parentId: "hfab4ag2fr",
                  renderMode: "CANVAS",
                  isLoading: false,
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                {
                  widgetName: "Text2",
                  displayName: "Text",
                  iconSVG:
                    "/static/media/icon.97c59b523e6f70ba6f40a10fc2c7c5b5.svg",
                  searchTags: ["typography", "paragraph", "label"],
                  topRow: 45,
                  bottomRow: 51,
                  parentRowSpace: 10,
                  type: "TEXT_WIDGET",
                  hideCard: false,
                  animateLoading: true,
                  overflow: "NONE",
                  fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
                  parentColumnSpace: 10.345703125,
                  leftColumn: 12,
                  dynamicBindingPathList: [
                    {
                      key: "fontFamily",
                    },
                    {
                      key: "borderRadius",
                    },
                  ],
                  shouldTruncate: false,
                  truncateButtonColor: "#FFC13D",
                  text: "Label",
                  key: "xosgai8vfh",
                  isDeprecated: false,
                  rightColumn: 51,
                  textAlign: "LEFT",
                  widgetId: "i5t134gcz2",
                  isVisible: true,
                  fontStyle: "BOLD",
                  textColor: "#231F20",
                  version: 1,
                  parentId: "hfab4ag2fr",
                  renderMode: "CANVAS",
                  isLoading: false,
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  fontSize: "1rem",
                },
              ],
              key: "du5dxsnp7w",
              isDeprecated: false,
              rightColumn: 481.5,
              detachFromLayout: true,
              widgetId: "hfab4ag2fr",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              containerStyle: "none",
              isVisible: true,
              version: 1,
              parentId: "3zdzo27neb",
              renderMode: "CANVAS",
              isLoading: false,
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
          ],
          borderWidth: "0",
          key: "y2bj1fyd3j",
          backgroundColor: "#FFFFFF",
          isDeprecated: false,
          rightColumn: 39,
          widgetId: "3zdzo27neb",
          containerStyle: "card",
          isVisible: true,
          version: 1,
          parentId: "0",
          renderMode: "CANVAS",
          isLoading: false,
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        },
      ],
    };

    expect(
      MigrateSelectTypeWidgetDefaultValue(input as any as DSLWidget),
    ).toEqual(output);
  });
});
