import { klona } from "klona";

import { DSLWidget } from "widgets/constants";
import { migrateChildStylesheetFromDynamicBindingPathList } from "./ThemingMigrations";

const inputDSL1 = ({
  widgetName: "MainContainer",
  backgroundColor: "none",
  rightColumn: 1224,
  snapColumns: 64,
  detachFromLayout: true,
  widgetId: "0",
  topRow: 0,
  bottomRow: 1040,
  containerStyle: "none",
  snapRows: 124,
  parentRowSpace: 1,
  type: "CANVAS_WIDGET",
  canExtend: true,
  version: 70,
  minHeight: 1250,
  parentColumnSpace: 1,
  dynamicBindingPathList: [],
  leftColumn: 0,
  children: [
    {
      schema: {
        __root_schema__: {
          children: {
            name: {
              children: {},
              dataType: "string",
              defaultValue:
                "{{((sourceData, formData, fieldState) => (sourceData.name))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              fieldType: "Text Input",
              sourceData: "John",
              isCustomField: false,
              accessor: "name",
              identifier: "name",
              position: 0,
              originalIdentifier: "name",
              accentColor:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              borderRadius:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              boxShadow: "none",
              iconAlign: "left",
              isDisabled: false,
              isRequired: false,
              isSpellCheck: false,
              isVisible: true,
              labelTextSize: "0.875rem",
              label: "Name",
            },
            date_of_birth: {
              children: {},
              dataType: "string",
              defaultValue:
                '{{((sourceData, formData, fieldState) => (moment(sourceData.date_of_birth, "DD/MM/YYYY").format("YYYY-MM-DDTHH:mm:ss.sssZ")))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}',
              fieldType: "Datepicker",
              sourceData: "20/02/1990",
              isCustomField: false,
              accessor: "date_of_birth",
              identifier: "date_of_birth",
              position: 1,
              originalIdentifier: "date_of_birth",
              accentColor:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              borderRadius:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              boxShadow: "none",
              closeOnSelection: false,
              convertToISO: false,
              dateFormat: "DD/MM/YYYY",
              isDisabled: false,
              isRequired: false,
              isVisible: true,
              label: "Date Of Birth",
              maxDate: "2121-12-31T18:29:00.000Z",
              minDate: "1920-12-31T18:30:00.000Z",
              shortcuts: false,
              timePrecision: "minute",
              labelTextSize: "0.875rem",
            },
            employee_id: {
              children: {},
              dataType: "number",
              defaultValue:
                "{{((sourceData, formData, fieldState) => (sourceData.employee_id))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              fieldType: "Number Input",
              sourceData: 1001,
              isCustomField: false,
              accessor: "employee_id",
              identifier: "employee_id",
              position: 2,
              originalIdentifier: "employee_id",
              accentColor:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              borderRadius:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              boxShadow: "none",
              iconAlign: "left",
              isDisabled: false,
              isRequired: false,
              isSpellCheck: false,
              isVisible: true,
              labelTextSize: "0.875rem",
              label: "Employee Id",
            },
            childStylesheet: {
              children: {},
              dataType: "string",
              defaultValue:
                "{{((sourceData, formData, fieldState) => (sourceData.childStylesheet))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              fieldType: "Text Input",
              sourceData: "asd",
              isCustomField: false,
              accessor: "childStylesheet",
              identifier: "childStylesheet",
              position: 3,
              originalIdentifier: "childStylesheet",
              accentColor:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              borderRadius:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              boxShadow: "none",
              iconAlign: "left",
              isDisabled: false,
              isRequired: false,
              isSpellCheck: false,
              isVisible: true,
              labelTextSize: "0.875rem",
              label: "Child Stylesheet",
            },
          },
          dataType: "object",
          defaultValue:
            "{{((sourceData, formData, fieldState) => (sourceData))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
          fieldType: "Object",
          sourceData: {
            name: "John",
            date_of_birth: "20/02/1990",
            employee_id: 1001,
            childStylesheet: "asd",
          },
          isCustomField: false,
          accessor: "__root_schema__",
          identifier: "__root_schema__",
          position: -1,
          originalIdentifier: "__root_schema__",
          borderRadius:
            "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
          boxShadow: "none",
          cellBorderRadius:
            "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
          cellBoxShadow: "none",
          isDisabled: false,
          isRequired: false,
          isVisible: true,
          labelTextSize: "0.875rem",
          label: "",
        },
      },
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      borderColor: "#E0DEDE",
      widgetName: "JSONForm1",
      submitButtonStyles: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
        buttonVariant: "PRIMARY",
      },
      dynamicPropertyPathList: [
        {
          key: "schema.__root_schema__.children.date_of_birth.defaultValue",
        },
      ],
      displayName: "JSON Form",
      iconSVG: "/static/media/icon.5b428de12db9ad6a591955ead07f86e9.svg",
      topRow: 0,
      bottomRow: 50,
      fieldLimitExceeded: false,
      parentRowSpace: 10,
      title: "Form",
      type: "JSON_FORM_WIDGET",
      hideCard: false,
      animateLoading: true,
      parentColumnSpace: 42.5625,
      dynamicTriggerPathList: [],
      leftColumn: 1,
      dynamicBindingPathList: [
        {
          key: "borderRadius",
        },
        {
          key: "boxShadow",
        },
        {
          key: "submitButtonStyles.buttonColor",
        },
        {
          key: "submitButtonStyles.borderRadius",
        },
        {
          key: "resetButtonStyles.buttonColor",
        },
        {
          key: "resetButtonStyles.borderRadius",
        },
        {
          key: "childStylesheet.ARRAY.accentColor",
        },
        {
          key: "childStylesheet.ARRAY.borderRadius",
        },
        {
          key: "childStylesheet.ARRAY.cellBorderRadius",
        },
        {
          key: "childStylesheet.OBJECT.borderRadius",
        },
        {
          key: "childStylesheet.OBJECT.cellBorderRadius",
        },
        {
          key: "childStylesheet.CHECKBOX.accentColor",
        },
        {
          key: "childStylesheet.CHECKBOX.borderRadius",
        },
        {
          key: "childStylesheet.CURRENCY_INPUT.accentColor",
        },
        {
          key: "childStylesheet.CURRENCY_INPUT.borderRadius",
        },
        {
          key: "childStylesheet.DATEPICKER.accentColor",
        },
        {
          key: "childStylesheet.DATEPICKER.borderRadius",
        },
        {
          key: "childStylesheet.EMAIL_INPUT.accentColor",
        },
        {
          key: "childStylesheet.EMAIL_INPUT.borderRadius",
        },
        {
          key: "childStylesheet.MULTISELECT.accentColor",
        },
        {
          key: "childStylesheet.MULTISELECT.borderRadius",
        },
        {
          key: "childStylesheet.MULTILINE_TEXT_INPUT.accentColor",
        },
        {
          key: "childStylesheet.MULTILINE_TEXT_INPUT.borderRadius",
        },
        {
          key: "childStylesheet.NUMBER_INPUT.accentColor",
        },
        {
          key: "childStylesheet.NUMBER_INPUT.borderRadius",
        },
        {
          key: "childStylesheet.PASSWORD_INPUT.accentColor",
        },
        {
          key: "childStylesheet.PASSWORD_INPUT.borderRadius",
        },
        {
          key: "childStylesheet.PHONE_NUMBER_INPUT.accentColor",
        },
        {
          key: "childStylesheet.PHONE_NUMBER_INPUT.borderRadius",
        },
        {
          key: "childStylesheet.RADIO_GROUP.accentColor",
        },
        {
          key: "childStylesheet.SELECT.accentColor",
        },
        {
          key: "childStylesheet.SELECT.borderRadius",
        },
        {
          key: "childStylesheet.SWITCH.accentColor",
        },
        {
          key: "childStylesheet.TEXT_INPUT.accentColor",
        },
        {
          key: "childStylesheet.TEXT_INPUT.borderRadius",
        },
        {
          key: "schema.__root_schema__.children.name.defaultValue",
        },
        {
          key: "schema.__root_schema__.children.name.accentColor",
        },
        {
          key: "schema.__root_schema__.children.name.borderRadius",
        },
        {
          key: "schema.__root_schema__.children.date_of_birth.defaultValue",
        },
        {
          key: "schema.__root_schema__.children.date_of_birth.accentColor",
        },
        {
          key: "schema.__root_schema__.children.date_of_birth.borderRadius",
        },
        {
          key: "schema.__root_schema__.children.employee_id.defaultValue",
        },
        {
          key: "schema.__root_schema__.children.employee_id.accentColor",
        },
        {
          key: "schema.__root_schema__.children.employee_id.borderRadius",
        },
        {
          key: "schema.__root_schema__.defaultValue",
        },
        {
          key: "schema.__root_schema__.borderRadius",
        },
        {
          key: "schema.__root_schema__.cellBorderRadius",
        },
        {
          key: "schema.__root_schema__.children.childStylesheet.defaultValue",
        },
        {
          key: "schema.__root_schema__.children.childStylesheet.accentColor",
        },
        {
          key: "schema.__root_schema__.children.childStylesheet.borderRadius",
        },
      ],
      borderWidth: "1",
      sourceData:
        '{\n  "name": "John",\n  "date_of_birth": "20/02/1990",\n  "employee_id": 1001,\n\t"childStylesheet":"asd"\n}',
      showReset: true,
      resetButtonLabel: "Reset",
      key: "4r1dire8mf",
      backgroundColor: "#fff",
      isDeprecated: false,
      rightColumn: 26,
      dynamicHeight: "FIXED",
      autoGenerateForm: true,
      widgetId: "136kliil8g",
      resetButtonStyles: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
        buttonVariant: "SECONDARY",
      },
      isVisible: true,
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      scrollContents: true,
      fixedFooter: true,
      submitButtonLabel: "Submit",
      childStylesheet: {
        ARRAY: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
          cellBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          cellBoxShadow: "none",
        },
        OBJECT: {
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
          cellBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          cellBoxShadow: "none",
        },
        CHECKBOX: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        },
        CURRENCY_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        DATEPICKER: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        EMAIL_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        MULTISELECT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        MULTILINE_TEXT_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        NUMBER_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        PASSWORD_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        PHONE_NUMBER_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        RADIO_GROUP: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          boxShadow: "none",
        },
        SELECT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        SWITCH: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          boxShadow: "none",
        },
        TEXT_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
      },
      disabledWhenInvalid: true,
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      maxDynamicHeight: 9000,
      minDynamicHeight: 4,
    },
    {
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      borderColor: "#E0DEDE",
      isVisibleDownload: true,
      iconSVG: "/static/media/icon.db8a9cbd2acd22a31ea91cc37ea2a46c.svg",
      topRow: 2,
      isSortable: true,
      type: "TABLE_WIDGET_V2",
      inlineEditingSaveOption: "ROW_LEVEL",
      animateLoading: true,
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
      leftColumn: 27,
      delimiter: ",",
      defaultSelectedRowIndex: 0,
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      isVisibleFilters: true,
      isVisible: true,
      enableClientSideSearch: true,
      version: 1,
      totalRecordsCount: 0,
      isLoading: false,
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
          saveBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
          discardBorderRadius:
            "{{appsmith.theme.borderRadius.appBorderRadius}}",
        },
      },
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      defaultSelectedRowIndices: [0],
      widgetName: "Table1",
      defaultPageSize: 0,
      columnOrder: ["step", "task", "status", "action"],
      dynamicPropertyPathList: [],
      displayName: "Table",
      bottomRow: 30,
      columnWidthMap: {
        task: 245,
        step: 62,
        status: 75,
      },
      parentRowSpace: 10,
      hideCard: false,
      parentColumnSpace: 42.5625,
      borderWidth: "1",
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
      key: "xi3zw81eiq",
      isDeprecated: false,
      rightColumn: 61,
      textSize: "0.875rem",
      widgetId: "6w4nk55npx",
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
      label: "Data",
      searchKey: "",
      parentId: "0",
      renderMode: "CANVAS",
      horizontalAlignment: "LEFT",
      isVisibleSearch: true,
      isVisiblePagination: true,
      verticalAlignment: "CENTER",
    },
    {
      boxShadow: "none",
      widgetName: "ButtonGroup1",
      isCanvas: false,
      displayName: "Button Group",
      iconSVG: "/static/media/icon.d6773218cfb61dcfa5f460d43371e30d.svg",
      searchTags: ["click", "submit"],
      topRow: 57,
      bottomRow: 61,
      parentRowSpace: 10,
      groupButtons: {
        groupButton1: {
          label: "Favorite",
          iconName: "heart",
          id: "groupButton1",
          widgetId: "",
          buttonType: "SIMPLE",
          placement: "CENTER",
          isVisible: true,
          isDisabled: false,
          index: 0,
          menuItems: {},
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
        groupButton2: {
          label: "Add",
          iconName: "add",
          id: "groupButton2",
          buttonType: "SIMPLE",
          placement: "CENTER",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 1,
          menuItems: {},
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
        groupButton3: {
          label: "More",
          iconName: "more",
          id: "groupButton3",
          buttonType: "MENU",
          placement: "CENTER",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 2,
          menuItems: {
            menuItem1: {
              label: "First Option",
              backgroundColor: "#FFFFFF",
              id: "menuItem1",
              widgetId: "",
              onClick: "",
              isVisible: true,
              isDisabled: false,
              index: 0,
            },
            menuItem2: {
              label: "Second Option",
              backgroundColor: "#FFFFFF",
              id: "menuItem2",
              widgetId: "",
              onClick: "",
              isVisible: true,
              isDisabled: false,
              index: 1,
            },
            menuItem3: {
              label: "Delete",
              iconName: "trash",
              iconColor: "#FFFFFF",
              iconAlign: "right",
              textColor: "#FFFFFF",
              backgroundColor: "#DD4B34",
              id: "menuItem3",
              widgetId: "",
              onClick: "",
              isVisible: true,
              isDisabled: false,
              index: 2,
            },
          },
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
      },
      type: "BUTTON_GROUP_WIDGET",
      hideCard: false,
      animateLoading: true,
      parentColumnSpace: 42.5625,
      leftColumn: 3,
      dynamicBindingPathList: [
        {
          key: "borderRadius",
        },
        {
          key: "childStylesheet.button.buttonColor",
        },
        {
          key: "groupButtons.groupButton1.buttonColor",
        },
        {
          key: "groupButtons.groupButton2.buttonColor",
        },
        {
          key: "groupButtons.groupButton3.buttonColor",
        },
      ],
      key: "kahzuua49o",
      orientation: "horizontal",
      isDeprecated: false,
      rightColumn: 27,
      widgetId: "tt1sptkg2z",
      isVisible: true,
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      childStylesheet: {
        button: {
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
      },
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      buttonVariant: "PRIMARY",
    },
    {
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      widgetName: "Container1",
      borderColor: "#E0DEDE",
      isCanvas: true,
      displayName: "Container",
      iconSVG: "/static/media/icon.1977dca3370505e2db3a8e44cfd54907.svg",
      searchTags: ["div", "parent", "group"],
      topRow: 44,
      bottomRow: 96,
      parentRowSpace: 10,
      type: "CONTAINER_WIDGET",
      hideCard: false,
      shouldScrollContents: true,
      animateLoading: true,
      parentColumnSpace: 42.5625,
      leftColumn: 27,
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
          widgetName: "Canvas1",
          displayName: "Canvas",
          topRow: 0,
          bottomRow: 520,
          parentRowSpace: 1,
          type: "CANVAS_WIDGET",
          canExtend: false,
          hideCard: true,
          minHeight: 520,
          parentColumnSpace: 1,
          leftColumn: 0,
          dynamicBindingPathList: [],
          children: [
            {
              schema: {
                __root_schema__: {
                  children: {
                    name: {
                      children: {},
                      dataType: "string",
                      defaultValue:
                        "{{((sourceData, formData, fieldState) => (sourceData.name))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      fieldType: "Text Input",
                      sourceData: "John",
                      isCustomField: false,
                      accessor: "name",
                      identifier: "name",
                      position: 0,
                      originalIdentifier: "name",
                      accentColor:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      borderRadius:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      boxShadow: "none",
                      iconAlign: "left",
                      isDisabled: false,
                      isRequired: false,
                      isSpellCheck: false,
                      isVisible: true,
                      labelTextSize: "0.875rem",
                      label: "Name",
                    },
                    date_of_birth: {
                      children: {},
                      dataType: "string",
                      defaultValue:
                        '{{((sourceData, formData, fieldState) => (moment(sourceData.date_of_birth, "DD/MM/YYYY").format("YYYY-MM-DDTHH:mm:ss.sssZ")))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}',
                      fieldType: "Datepicker",
                      sourceData: "20/02/1990",
                      isCustomField: false,
                      accessor: "date_of_birth",
                      identifier: "date_of_birth",
                      position: 1,
                      originalIdentifier: "date_of_birth",
                      accentColor:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      borderRadius:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      boxShadow: "none",
                      closeOnSelection: false,
                      convertToISO: false,
                      dateFormat: "DD/MM/YYYY",
                      isDisabled: false,
                      isRequired: false,
                      isVisible: true,
                      label: "Date Of Birth",
                      maxDate: "2121-12-31T18:29:00.000Z",
                      minDate: "1920-12-31T18:30:00.000Z",
                      shortcuts: false,
                      timePrecision: "minute",
                      labelTextSize: "0.875rem",
                    },
                    employee_id: {
                      children: {},
                      dataType: "number",
                      defaultValue:
                        "{{((sourceData, formData, fieldState) => (sourceData.employee_id))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      fieldType: "Number Input",
                      sourceData: 1001,
                      isCustomField: false,
                      accessor: "employee_id",
                      identifier: "employee_id",
                      position: 2,
                      originalIdentifier: "employee_id",
                      accentColor:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      borderRadius:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      boxShadow: "none",
                      iconAlign: "left",
                      isDisabled: false,
                      isRequired: false,
                      isSpellCheck: false,
                      isVisible: true,
                      labelTextSize: "0.875rem",
                      label: "Employee Id",
                    },
                  },
                  dataType: "object",
                  defaultValue:
                    "{{((sourceData, formData, fieldState) => (sourceData))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                  fieldType: "Object",
                  sourceData: {
                    name: "John",
                    date_of_birth: "20/02/1990",
                    employee_id: 1001,
                  },
                  isCustomField: false,
                  accessor: "__root_schema__",
                  identifier: "__root_schema__",
                  position: -1,
                  originalIdentifier: "__root_schema__",
                  borderRadius:
                    "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                  cellBoxShadow: "none",
                  isDisabled: false,
                  isRequired: false,
                  isVisible: true,
                  labelTextSize: "0.875rem",
                  label: "",
                },
              },
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              borderColor: "#E0DEDE",
              widgetName: "JSONForm2",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
                buttonVariant: "PRIMARY",
              },
              dynamicPropertyPathList: [
                {
                  key:
                    "schema.__root_schema__.children.date_of_birth.defaultValue",
                },
              ],
              displayName: "JSON Form",
              iconSVG:
                "/static/media/icon.5b428de12db9ad6a591955ead07f86e9.svg",
              topRow: 0,
              bottomRow: 50,
              fieldLimitExceeded: false,
              parentRowSpace: 10,
              title: "Form",
              type: "JSON_FORM_WIDGET",
              hideCard: false,
              animateLoading: true,
              parentColumnSpace: 15.6484375,
              dynamicTriggerPathList: [],
              leftColumn: 13,
              dynamicBindingPathList: [
                {
                  key: "borderRadius",
                },
                {
                  key: "boxShadow",
                },
                {
                  key: "submitButtonStyles.buttonColor",
                },
                {
                  key: "submitButtonStyles.borderRadius",
                },
                {
                  key: "resetButtonStyles.buttonColor",
                },
                {
                  key: "resetButtonStyles.borderRadius",
                },
                {
                  key: "childStylesheet.ARRAY.accentColor",
                },
                {
                  key: "childStylesheet.ARRAY.borderRadius",
                },
                {
                  key: "childStylesheet.ARRAY.cellBorderRadius",
                },
                {
                  key: "childStylesheet.OBJECT.borderRadius",
                },
                {
                  key: "childStylesheet.OBJECT.cellBorderRadius",
                },
                {
                  key: "childStylesheet.CHECKBOX.accentColor",
                },
                {
                  key: "childStylesheet.CHECKBOX.borderRadius",
                },
                {
                  key: "childStylesheet.CURRENCY_INPUT.accentColor",
                },
                {
                  key: "childStylesheet.CURRENCY_INPUT.borderRadius",
                },
                {
                  key: "childStylesheet.DATEPICKER.accentColor",
                },
                {
                  key: "childStylesheet.DATEPICKER.borderRadius",
                },
                {
                  key: "childStylesheet.EMAIL_INPUT.accentColor",
                },
                {
                  key: "childStylesheet.EMAIL_INPUT.borderRadius",
                },
                {
                  key: "childStylesheet.MULTISELECT.accentColor",
                },
                {
                  key: "childStylesheet.MULTISELECT.borderRadius",
                },
                {
                  key: "childStylesheet.MULTILINE_TEXT_INPUT.accentColor",
                },
                {
                  key: "childStylesheet.MULTILINE_TEXT_INPUT.borderRadius",
                },
                {
                  key: "childStylesheet.NUMBER_INPUT.accentColor",
                },
                {
                  key: "childStylesheet.NUMBER_INPUT.borderRadius",
                },
                {
                  key: "childStylesheet.PASSWORD_INPUT.accentColor",
                },
                {
                  key: "childStylesheet.PASSWORD_INPUT.borderRadius",
                },
                {
                  key: "childStylesheet.PHONE_NUMBER_INPUT.accentColor",
                },
                {
                  key: "childStylesheet.PHONE_NUMBER_INPUT.borderRadius",
                },
                {
                  key: "childStylesheet.RADIO_GROUP.accentColor",
                },
                {
                  key: "childStylesheet.SELECT.accentColor",
                },
                {
                  key: "childStylesheet.SELECT.borderRadius",
                },
                {
                  key: "childStylesheet.SWITCH.accentColor",
                },
                {
                  key: "childStylesheet.TEXT_INPUT.accentColor",
                },
                {
                  key: "childStylesheet.TEXT_INPUT.borderRadius",
                },
                {
                  key: "schema.__root_schema__.children.name.defaultValue",
                },
                {
                  key: "schema.__root_schema__.children.name.accentColor",
                },
                {
                  key: "schema.__root_schema__.children.name.borderRadius",
                },
                {
                  key:
                    "schema.__root_schema__.children.date_of_birth.defaultValue",
                },
                {
                  key:
                    "schema.__root_schema__.children.date_of_birth.accentColor",
                },
                {
                  key:
                    "schema.__root_schema__.children.date_of_birth.borderRadius",
                },
                {
                  key:
                    "schema.__root_schema__.children.employee_id.defaultValue",
                },
                {
                  key:
                    "schema.__root_schema__.children.employee_id.accentColor",
                },
                {
                  key:
                    "schema.__root_schema__.children.employee_id.borderRadius",
                },
                {
                  key: "schema.__root_schema__.defaultValue",
                },
                {
                  key: "schema.__root_schema__.borderRadius",
                },
                {
                  key: "schema.__root_schema__.cellBorderRadius",
                },
              ],
              borderWidth: "1",
              sourceData: {
                name: "John",
                date_of_birth: "20/02/1990",
                employee_id: 1001,
              },
              showReset: true,
              resetButtonLabel: "Reset",
              key: "4r1dire8mf",
              backgroundColor: "#fff",
              isDeprecated: false,
              rightColumn: 38,
              dynamicHeight: "FIXED",
              autoGenerateForm: true,
              widgetId: "3m7vsrp7a8",
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
                buttonVariant: "SECONDARY",
              },
              isVisible: true,
              version: 1,
              parentId: "q71uafkl98",
              renderMode: "CANVAS",
              isLoading: false,
              scrollContents: true,
              fixedFooter: true,
              submitButtonLabel: "Submit",
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
              disabledWhenInvalid: true,
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              maxDynamicHeight: 9000,
              minDynamicHeight: 4,
            },
          ],
          key: "rkukmmul97",
          isDeprecated: false,
          rightColumn: 1021.5,
          detachFromLayout: true,
          widgetId: "q71uafkl98",
          containerStyle: "none",
          isVisible: true,
          version: 1,
          parentId: "08plhw35jc",
          renderMode: "CANVAS",
          isLoading: false,
        },
      ],
      borderWidth: "1",
      key: "c5ggn97bsx",
      backgroundColor: "#FFFFFF",
      isDeprecated: false,
      rightColumn: 51,
      dynamicHeight: "AUTO_HEIGHT",
      widgetId: "08plhw35jc",
      containerStyle: "card",
      isVisible: true,
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      originalTopRow: 44,
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      maxDynamicHeight: 9000,
      originalBottomRow: 54,
      minDynamicHeight: 10,
    },
  ],
} as unknown) as DSLWidget;

const outputDSL1 = {
  widgetName: "MainContainer",
  backgroundColor: "none",
  rightColumn: 1224,
  snapColumns: 64,
  detachFromLayout: true,
  widgetId: "0",
  topRow: 0,
  bottomRow: 1040,
  containerStyle: "none",
  snapRows: 124,
  parentRowSpace: 1,
  type: "CANVAS_WIDGET",
  canExtend: true,
  version: 70,
  minHeight: 1250,
  parentColumnSpace: 1,
  dynamicBindingPathList: [],
  leftColumn: 0,
  children: [
    {
      schema: {
        __root_schema__: {
          children: {
            name: {
              children: {},
              dataType: "string",
              defaultValue:
                "{{((sourceData, formData, fieldState) => (sourceData.name))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              fieldType: "Text Input",
              sourceData: "John",
              isCustomField: false,
              accessor: "name",
              identifier: "name",
              position: 0,
              originalIdentifier: "name",
              accentColor:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              borderRadius:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              boxShadow: "none",
              iconAlign: "left",
              isDisabled: false,
              isRequired: false,
              isSpellCheck: false,
              isVisible: true,
              labelTextSize: "0.875rem",
              label: "Name",
            },
            date_of_birth: {
              children: {},
              dataType: "string",
              defaultValue:
                '{{((sourceData, formData, fieldState) => (moment(sourceData.date_of_birth, "DD/MM/YYYY").format("YYYY-MM-DDTHH:mm:ss.sssZ")))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}',
              fieldType: "Datepicker",
              sourceData: "20/02/1990",
              isCustomField: false,
              accessor: "date_of_birth",
              identifier: "date_of_birth",
              position: 1,
              originalIdentifier: "date_of_birth",
              accentColor:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              borderRadius:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              boxShadow: "none",
              closeOnSelection: false,
              convertToISO: false,
              dateFormat: "DD/MM/YYYY",
              isDisabled: false,
              isRequired: false,
              isVisible: true,
              label: "Date Of Birth",
              maxDate: "2121-12-31T18:29:00.000Z",
              minDate: "1920-12-31T18:30:00.000Z",
              shortcuts: false,
              timePrecision: "minute",
              labelTextSize: "0.875rem",
            },
            employee_id: {
              children: {},
              dataType: "number",
              defaultValue:
                "{{((sourceData, formData, fieldState) => (sourceData.employee_id))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              fieldType: "Number Input",
              sourceData: 1001,
              isCustomField: false,
              accessor: "employee_id",
              identifier: "employee_id",
              position: 2,
              originalIdentifier: "employee_id",
              accentColor:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              borderRadius:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              boxShadow: "none",
              iconAlign: "left",
              isDisabled: false,
              isRequired: false,
              isSpellCheck: false,
              isVisible: true,
              labelTextSize: "0.875rem",
              label: "Employee Id",
            },
            childStylesheet: {
              children: {},
              dataType: "string",
              defaultValue:
                "{{((sourceData, formData, fieldState) => (sourceData.childStylesheet))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              fieldType: "Text Input",
              sourceData: "asd",
              isCustomField: false,
              accessor: "childStylesheet",
              identifier: "childStylesheet",
              position: 3,
              originalIdentifier: "childStylesheet",
              accentColor:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              borderRadius:
                "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
              boxShadow: "none",
              iconAlign: "left",
              isDisabled: false,
              isRequired: false,
              isSpellCheck: false,
              isVisible: true,
              labelTextSize: "0.875rem",
              label: "Child Stylesheet",
            },
          },
          dataType: "object",
          defaultValue:
            "{{((sourceData, formData, fieldState) => (sourceData))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
          fieldType: "Object",
          sourceData: {
            name: "John",
            date_of_birth: "20/02/1990",
            employee_id: 1001,
            childStylesheet: "asd",
          },
          isCustomField: false,
          accessor: "__root_schema__",
          identifier: "__root_schema__",
          position: -1,
          originalIdentifier: "__root_schema__",
          borderRadius:
            "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
          boxShadow: "none",
          cellBorderRadius:
            "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm1.sourceData, JSONForm1.formData, JSONForm1.fieldState)}}",
          cellBoxShadow: "none",
          isDisabled: false,
          isRequired: false,
          isVisible: true,
          labelTextSize: "0.875rem",
          label: "",
        },
      },
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      borderColor: "#E0DEDE",
      widgetName: "JSONForm1",
      submitButtonStyles: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
        buttonVariant: "PRIMARY",
      },
      dynamicPropertyPathList: [
        {
          key: "schema.__root_schema__.children.date_of_birth.defaultValue",
        },
      ],
      displayName: "JSON Form",
      iconSVG: "/static/media/icon.5b428de12db9ad6a591955ead07f86e9.svg",
      topRow: 0,
      bottomRow: 50,
      fieldLimitExceeded: false,
      parentRowSpace: 10,
      title: "Form",
      type: "JSON_FORM_WIDGET",
      hideCard: false,
      animateLoading: true,
      parentColumnSpace: 42.5625,
      dynamicTriggerPathList: [],
      leftColumn: 1,
      dynamicBindingPathList: [
        {
          key: "borderRadius",
        },
        {
          key: "boxShadow",
        },
        {
          key: "submitButtonStyles.buttonColor",
        },
        {
          key: "submitButtonStyles.borderRadius",
        },
        {
          key: "resetButtonStyles.buttonColor",
        },
        {
          key: "resetButtonStyles.borderRadius",
        },
        {
          key: "schema.__root_schema__.children.name.defaultValue",
        },
        {
          key: "schema.__root_schema__.children.name.accentColor",
        },
        {
          key: "schema.__root_schema__.children.name.borderRadius",
        },
        {
          key: "schema.__root_schema__.children.date_of_birth.defaultValue",
        },
        {
          key: "schema.__root_schema__.children.date_of_birth.accentColor",
        },
        {
          key: "schema.__root_schema__.children.date_of_birth.borderRadius",
        },
        {
          key: "schema.__root_schema__.children.employee_id.defaultValue",
        },
        {
          key: "schema.__root_schema__.children.employee_id.accentColor",
        },
        {
          key: "schema.__root_schema__.children.employee_id.borderRadius",
        },
        {
          key: "schema.__root_schema__.defaultValue",
        },
        {
          key: "schema.__root_schema__.borderRadius",
        },
        {
          key: "schema.__root_schema__.cellBorderRadius",
        },
        {
          key: "schema.__root_schema__.children.childStylesheet.defaultValue",
        },
        {
          key: "schema.__root_schema__.children.childStylesheet.accentColor",
        },
        {
          key: "schema.__root_schema__.children.childStylesheet.borderRadius",
        },
      ],
      borderWidth: "1",
      sourceData:
        '{\n  "name": "John",\n  "date_of_birth": "20/02/1990",\n  "employee_id": 1001,\n\t"childStylesheet":"asd"\n}',
      showReset: true,
      resetButtonLabel: "Reset",
      key: "4r1dire8mf",
      backgroundColor: "#fff",
      isDeprecated: false,
      rightColumn: 26,
      dynamicHeight: "FIXED",
      autoGenerateForm: true,
      widgetId: "136kliil8g",
      resetButtonStyles: {
        buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        boxShadow: "none",
        buttonVariant: "SECONDARY",
      },
      isVisible: true,
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      scrollContents: true,
      fixedFooter: true,
      submitButtonLabel: "Submit",
      childStylesheet: {
        ARRAY: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
          cellBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          cellBoxShadow: "none",
        },
        OBJECT: {
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
          cellBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          cellBoxShadow: "none",
        },
        CHECKBOX: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        },
        CURRENCY_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        DATEPICKER: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        EMAIL_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        MULTISELECT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        MULTILINE_TEXT_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        NUMBER_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        PASSWORD_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        PHONE_NUMBER_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        RADIO_GROUP: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          boxShadow: "none",
        },
        SELECT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
        SWITCH: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          boxShadow: "none",
        },
        TEXT_INPUT: {
          accentColor: "{{appsmith.theme.colors.primaryColor}}",
          borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          boxShadow: "none",
        },
      },
      disabledWhenInvalid: true,
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      maxDynamicHeight: 9000,
      minDynamicHeight: 4,
    },
    {
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      borderColor: "#E0DEDE",
      isVisibleDownload: true,
      iconSVG: "/static/media/icon.db8a9cbd2acd22a31ea91cc37ea2a46c.svg",
      topRow: 2,
      isSortable: true,
      type: "TABLE_WIDGET_V2",
      inlineEditingSaveOption: "ROW_LEVEL",
      animateLoading: true,
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
      ],
      leftColumn: 27,
      delimiter: ",",
      defaultSelectedRowIndex: 0,
      accentColor: "{{appsmith.theme.colors.primaryColor}}",
      isVisibleFilters: true,
      isVisible: true,
      enableClientSideSearch: true,
      version: 1,
      totalRecordsCount: 0,
      isLoading: false,
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
          saveBorderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
          discardBorderRadius:
            "{{appsmith.theme.borderRadius.appBorderRadius}}",
        },
      },
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      defaultSelectedRowIndices: [0],
      widgetName: "Table1",
      defaultPageSize: 0,
      columnOrder: ["step", "task", "status", "action"],
      dynamicPropertyPathList: [],
      displayName: "Table",
      bottomRow: 30,
      columnWidthMap: {
        task: 245,
        step: 62,
        status: 75,
      },
      parentRowSpace: 10,
      hideCard: false,
      parentColumnSpace: 42.5625,
      borderWidth: "1",
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
      key: "xi3zw81eiq",
      isDeprecated: false,
      rightColumn: 61,
      textSize: "0.875rem",
      widgetId: "6w4nk55npx",
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
      label: "Data",
      searchKey: "",
      parentId: "0",
      renderMode: "CANVAS",
      horizontalAlignment: "LEFT",
      isVisibleSearch: true,
      isVisiblePagination: true,
      verticalAlignment: "CENTER",
    },
    {
      boxShadow: "none",
      widgetName: "ButtonGroup1",
      isCanvas: false,
      displayName: "Button Group",
      iconSVG: "/static/media/icon.d6773218cfb61dcfa5f460d43371e30d.svg",
      searchTags: ["click", "submit"],
      topRow: 57,
      bottomRow: 61,
      parentRowSpace: 10,
      groupButtons: {
        groupButton1: {
          label: "Favorite",
          iconName: "heart",
          id: "groupButton1",
          widgetId: "",
          buttonType: "SIMPLE",
          placement: "CENTER",
          isVisible: true,
          isDisabled: false,
          index: 0,
          menuItems: {},
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
        groupButton2: {
          label: "Add",
          iconName: "add",
          id: "groupButton2",
          buttonType: "SIMPLE",
          placement: "CENTER",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 1,
          menuItems: {},
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
        groupButton3: {
          label: "More",
          iconName: "more",
          id: "groupButton3",
          buttonType: "MENU",
          placement: "CENTER",
          widgetId: "",
          isVisible: true,
          isDisabled: false,
          index: 2,
          menuItems: {
            menuItem1: {
              label: "First Option",
              backgroundColor: "#FFFFFF",
              id: "menuItem1",
              widgetId: "",
              onClick: "",
              isVisible: true,
              isDisabled: false,
              index: 0,
            },
            menuItem2: {
              label: "Second Option",
              backgroundColor: "#FFFFFF",
              id: "menuItem2",
              widgetId: "",
              onClick: "",
              isVisible: true,
              isDisabled: false,
              index: 1,
            },
            menuItem3: {
              label: "Delete",
              iconName: "trash",
              iconColor: "#FFFFFF",
              iconAlign: "right",
              textColor: "#FFFFFF",
              backgroundColor: "#DD4B34",
              id: "menuItem3",
              widgetId: "",
              onClick: "",
              isVisible: true,
              isDisabled: false,
              index: 2,
            },
          },
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
      },
      type: "BUTTON_GROUP_WIDGET",
      hideCard: false,
      animateLoading: true,
      parentColumnSpace: 42.5625,
      leftColumn: 3,
      dynamicBindingPathList: [
        {
          key: "borderRadius",
        },
        {
          key: "groupButtons.groupButton1.buttonColor",
        },
        {
          key: "groupButtons.groupButton2.buttonColor",
        },
        {
          key: "groupButtons.groupButton3.buttonColor",
        },
      ],
      key: "kahzuua49o",
      orientation: "horizontal",
      isDeprecated: false,
      rightColumn: 27,
      widgetId: "tt1sptkg2z",
      isVisible: true,
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      childStylesheet: {
        button: {
          buttonColor: "{{appsmith.theme.colors.primaryColor}}",
        },
      },
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      buttonVariant: "PRIMARY",
    },
    {
      boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
      widgetName: "Container1",
      borderColor: "#E0DEDE",
      isCanvas: true,
      displayName: "Container",
      iconSVG: "/static/media/icon.1977dca3370505e2db3a8e44cfd54907.svg",
      searchTags: ["div", "parent", "group"],
      topRow: 44,
      bottomRow: 96,
      parentRowSpace: 10,
      type: "CONTAINER_WIDGET",
      hideCard: false,
      shouldScrollContents: true,
      animateLoading: true,
      parentColumnSpace: 42.5625,
      leftColumn: 27,
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
          widgetName: "Canvas1",
          displayName: "Canvas",
          topRow: 0,
          bottomRow: 520,
          parentRowSpace: 1,
          type: "CANVAS_WIDGET",
          canExtend: false,
          hideCard: true,
          minHeight: 520,
          parentColumnSpace: 1,
          leftColumn: 0,
          dynamicBindingPathList: [],
          children: [
            {
              schema: {
                __root_schema__: {
                  children: {
                    name: {
                      children: {},
                      dataType: "string",
                      defaultValue:
                        "{{((sourceData, formData, fieldState) => (sourceData.name))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      fieldType: "Text Input",
                      sourceData: "John",
                      isCustomField: false,
                      accessor: "name",
                      identifier: "name",
                      position: 0,
                      originalIdentifier: "name",
                      accentColor:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      borderRadius:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      boxShadow: "none",
                      iconAlign: "left",
                      isDisabled: false,
                      isRequired: false,
                      isSpellCheck: false,
                      isVisible: true,
                      labelTextSize: "0.875rem",
                      label: "Name",
                    },
                    date_of_birth: {
                      children: {},
                      dataType: "string",
                      defaultValue:
                        '{{((sourceData, formData, fieldState) => (moment(sourceData.date_of_birth, "DD/MM/YYYY").format("YYYY-MM-DDTHH:mm:ss.sssZ")))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}',
                      fieldType: "Datepicker",
                      sourceData: "20/02/1990",
                      isCustomField: false,
                      accessor: "date_of_birth",
                      identifier: "date_of_birth",
                      position: 1,
                      originalIdentifier: "date_of_birth",
                      accentColor:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      borderRadius:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      boxShadow: "none",
                      closeOnSelection: false,
                      convertToISO: false,
                      dateFormat: "DD/MM/YYYY",
                      isDisabled: false,
                      isRequired: false,
                      isVisible: true,
                      label: "Date Of Birth",
                      maxDate: "2121-12-31T18:29:00.000Z",
                      minDate: "1920-12-31T18:30:00.000Z",
                      shortcuts: false,
                      timePrecision: "minute",
                      labelTextSize: "0.875rem",
                    },
                    employee_id: {
                      children: {},
                      dataType: "number",
                      defaultValue:
                        "{{((sourceData, formData, fieldState) => (sourceData.employee_id))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      fieldType: "Number Input",
                      sourceData: 1001,
                      isCustomField: false,
                      accessor: "employee_id",
                      identifier: "employee_id",
                      position: 2,
                      originalIdentifier: "employee_id",
                      accentColor:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.colors.primaryColor))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      borderRadius:
                        "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                      boxShadow: "none",
                      iconAlign: "left",
                      isDisabled: false,
                      isRequired: false,
                      isSpellCheck: false,
                      isVisible: true,
                      labelTextSize: "0.875rem",
                      label: "Employee Id",
                    },
                  },
                  dataType: "object",
                  defaultValue:
                    "{{((sourceData, formData, fieldState) => (sourceData))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                  fieldType: "Object",
                  sourceData: {
                    name: "John",
                    date_of_birth: "20/02/1990",
                    employee_id: 1001,
                  },
                  isCustomField: false,
                  accessor: "__root_schema__",
                  identifier: "__root_schema__",
                  position: -1,
                  originalIdentifier: "__root_schema__",
                  borderRadius:
                    "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{((sourceData, formData, fieldState) => (appsmith.theme.borderRadius.appBorderRadius))(JSONForm2.sourceData, JSONForm2.formData, JSONForm2.fieldState)}}",
                  cellBoxShadow: "none",
                  isDisabled: false,
                  isRequired: false,
                  isVisible: true,
                  labelTextSize: "0.875rem",
                  label: "",
                },
              },
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              borderColor: "#E0DEDE",
              widgetName: "JSONForm2",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
                buttonVariant: "PRIMARY",
              },
              dynamicPropertyPathList: [
                {
                  key:
                    "schema.__root_schema__.children.date_of_birth.defaultValue",
                },
              ],
              displayName: "JSON Form",
              iconSVG:
                "/static/media/icon.5b428de12db9ad6a591955ead07f86e9.svg",
              topRow: 0,
              bottomRow: 50,
              fieldLimitExceeded: false,
              parentRowSpace: 10,
              title: "Form",
              type: "JSON_FORM_WIDGET",
              hideCard: false,
              animateLoading: true,
              parentColumnSpace: 15.6484375,
              dynamicTriggerPathList: [],
              leftColumn: 13,
              dynamicBindingPathList: [
                {
                  key: "borderRadius",
                },
                {
                  key: "boxShadow",
                },
                {
                  key: "submitButtonStyles.buttonColor",
                },
                {
                  key: "submitButtonStyles.borderRadius",
                },
                {
                  key: "resetButtonStyles.buttonColor",
                },
                {
                  key: "resetButtonStyles.borderRadius",
                },
                {
                  key: "schema.__root_schema__.children.name.defaultValue",
                },
                {
                  key: "schema.__root_schema__.children.name.accentColor",
                },
                {
                  key: "schema.__root_schema__.children.name.borderRadius",
                },
                {
                  key:
                    "schema.__root_schema__.children.date_of_birth.defaultValue",
                },
                {
                  key:
                    "schema.__root_schema__.children.date_of_birth.accentColor",
                },
                {
                  key:
                    "schema.__root_schema__.children.date_of_birth.borderRadius",
                },
                {
                  key:
                    "schema.__root_schema__.children.employee_id.defaultValue",
                },
                {
                  key:
                    "schema.__root_schema__.children.employee_id.accentColor",
                },
                {
                  key:
                    "schema.__root_schema__.children.employee_id.borderRadius",
                },
                {
                  key: "schema.__root_schema__.defaultValue",
                },
                {
                  key: "schema.__root_schema__.borderRadius",
                },
                {
                  key: "schema.__root_schema__.cellBorderRadius",
                },
              ],
              borderWidth: "1",
              sourceData: {
                name: "John",
                date_of_birth: "20/02/1990",
                employee_id: 1001,
              },
              showReset: true,
              resetButtonLabel: "Reset",
              key: "4r1dire8mf",
              backgroundColor: "#fff",
              isDeprecated: false,
              rightColumn: 38,
              dynamicHeight: "FIXED",
              autoGenerateForm: true,
              widgetId: "3m7vsrp7a8",
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
                buttonVariant: "SECONDARY",
              },
              isVisible: true,
              version: 1,
              parentId: "q71uafkl98",
              renderMode: "CANVAS",
              isLoading: false,
              scrollContents: true,
              fixedFooter: true,
              submitButtonLabel: "Submit",
              childStylesheet: {
                ARRAY: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                OBJECT: {
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                  cellBorderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  cellBoxShadow: "none",
                },
                CHECKBOX: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                },
                CURRENCY_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                DATEPICKER: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                EMAIL_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTISELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                MULTILINE_TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PASSWORD_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                PHONE_NUMBER_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                RADIO_GROUP: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                SELECT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                SWITCH: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  boxShadow: "none",
                },
                TEXT_INPUT: {
                  accentColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
              disabledWhenInvalid: true,
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              maxDynamicHeight: 9000,
              minDynamicHeight: 4,
            },
          ],
          key: "rkukmmul97",
          isDeprecated: false,
          rightColumn: 1021.5,
          detachFromLayout: true,
          widgetId: "q71uafkl98",
          containerStyle: "none",
          isVisible: true,
          version: 1,
          parentId: "08plhw35jc",
          renderMode: "CANVAS",
          isLoading: false,
        },
      ],
      borderWidth: "1",
      key: "c5ggn97bsx",
      backgroundColor: "#FFFFFF",
      isDeprecated: false,
      rightColumn: 51,
      dynamicHeight: "AUTO_HEIGHT",
      widgetId: "08plhw35jc",
      containerStyle: "card",
      isVisible: true,
      version: 1,
      parentId: "0",
      renderMode: "CANVAS",
      isLoading: false,
      originalTopRow: 44,
      borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      maxDynamicHeight: 9000,
      originalBottomRow: 54,
      minDynamicHeight: 10,
    },
  ],
};

describe("Theming Migration - .migrateChildStylesheetFromDynamicBindingPathList", () => {
  it("removes childStylesheet paths from dynamicBindingPathList", () => {
    const resultDSL = migrateChildStylesheetFromDynamicBindingPathList(
      klona(inputDSL1),
    );

    expect(resultDSL).toStrictEqual(outputDSL1);
  });
});
