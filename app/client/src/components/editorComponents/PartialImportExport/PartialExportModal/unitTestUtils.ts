import { UNUSED_ENV_ID } from "constants/EnvironmentContants";
import type { Datasource } from "entities/Datasource";
import type { CanvasStructure } from "reducers/uiReducers/pageCanvasStructureReducer";

export const getAllWidgetIds = (widget: CanvasStructure): string[] =>
  (widget.widgetId ? [widget.widgetId] : []).concat(
    (widget.children || []).flatMap((child) => getAllWidgetIds(child)),
  );

export const mockTblUserInfoWidgetId = "30s2xz9lqx";
export const mockWidgetsProps = {
  widgetId: "0",
  widgetName: "MainContainer",
  type: "CANVAS_WIDGET",
  children: [
    {
      widgetId: "76t6mkfckv",
      widgetName: "txt_pageTitle",
      type: "TEXT_WIDGET",
    },
    {
      widgetId: "30s2xz9lqx",
      widgetName: "tbl_userInfo",
      type: "TABLE_WIDGET_V2",
    },
    {
      widgetId: "gz1wda6co5",
      widgetName: "con_userDetails",
      type: "FORM_WIDGET",
      children: [
        {
          widgetId: "ksqoq712gb",
          widgetName: "txt_userFullName",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "2xoes8wilz",
          widgetName: "txt_countryValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "av2rmb7w6k",
          widgetName: "txt_updatedAtValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "49fw3yiijl",
          widgetName: "txt_createdAtValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "yrnf6ebevh",
          widgetName: "txt_longitudeValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "z5vabtkhbb",
          widgetName: "txt_latitudeValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "308vo9jh63",
          widgetName: "txt_phoneValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "5qcop7cwtm",
          widgetName: "txt_dobValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "oid24ma9vw",
          widgetName: "txt_genderValue",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "y4kqr6s084",
          widgetName: "txt_userEmail",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "u753uo6af8",
          widgetName: "txt_country",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "gsgr0ynhbb",
          widgetName: "txt_updatedAt",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "3etip5rg1a",
          widgetName: "txt_createdAt",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "81esy5jfi0",
          widgetName: "txt_longitude",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "z5j3zsmu38",
          widgetName: "txt_latitude",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "v03001ino4",
          widgetName: "txt_phone",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "z434i5dlb7",
          widgetName: "txt_dob",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "4hqs7tr225",
          widgetName: "txt_gender",
          type: "TEXT_WIDGET",
        },
        {
          widgetId: "6st25auvr3",
          widgetName: "div_detailDivider",
          type: "DIVIDER_WIDGET",
        },
        {
          widgetId: "jf6mghk92c",
          widgetName: "img_userImage",
          type: "IMAGE_WIDGET",
        },
      ],
    },
  ],
};
export const mockDataBaseProps = {
  Movies: [
    {
      type: "DB",
      entity: {
        id: "659fec82d0cbfb0c5e0a745b",
        name: "Query1",
      },
      group: "Movies",
    },
  ],
  users: [
    {
      type: "DB",
      entity: {
        id: "659f81c8d0cbfb0c5e0a743e",
        name: "getUsers",
      },
      group: "users",
    },
  ],
};
export const mockAppDSProps: Datasource[] = [
  {
    id: "659febdcd0cbfb0c5e0a7457",
    userPermissions: [
      "execute:datasources",
      "delete:datasources",
      "manage:datasources",
      "read:datasources",
    ],
    name: "Movies",
    pluginId: "653236205e9a6424e4c04b53",
    workspaceId: "659d2e14d0cbfb0c5e0a7424",
    datasourceStorages: {
      unused_env: {
        datasourceId: "659febdcd0cbfb0c5e0a7457",
        environmentId: UNUSED_ENV_ID,
        datasourceConfiguration: {
          url: "string",
          connection: {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mode: "READ_WRITE" as any,
            ssl: {
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              authType: "DEFAULT" as any,
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          },
          authentication: {
            authenticationType: "dbAuth",
            authType: "SCRAM_SHA_1",
            username: "mockdb-admin",
          },
          properties: [
            {
              key: "Use mongo connection string URI",
              value: "Yes",
            },
            {
              key: "Connection string URI",
              value:
                "mongodb+srv://mockdb-admin:****@mockdb.kce5o.mongodb.net/movies?w=majority&retrywrites=true&authsource=admin&minpoolsize=0",
            },
          ],
        },
        isConfigured: true,
        isValid: true,
      },
    },
    invalids: [],
    messages: [],
    isMock: true,
  },
  {
    id: "659f81c8d0cbfb0c5e0a743c",
    userPermissions: [
      "execute:datasources",
      "delete:datasources",
      "manage:datasources",
      "read:datasources",
    ],
    name: "users",
    pluginId: "653236205e9a6424e4c04b51",
    workspaceId: "659d2e14d0cbfb0c5e0a7424",
    datasourceStorages: {
      unused_env: {
        datasourceId: "659f81c8d0cbfb0c5e0a743c",
        environmentId: UNUSED_ENV_ID,
        datasourceConfiguration: {
          url: "string",
          connection: {
            // TODO: Fix this the next time the file is edited
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mode: "READ_WRITE" as any,
            ssl: {
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              authType: "DEFAULT" as any,
              // TODO: Fix this the next time the file is edited
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any,
          },

          authentication: {
            authenticationType: "dbAuth",
            username: "users",
          },
        },
        isConfigured: true,
        isValid: true,
      },
    },
    invalids: [],
    messages: [],
    isMock: true,
  },
];

export const defaultAppState = {
  entities: {
    canvasWidgets: {
      "0": {
        widgetName: "MainContainer",
        backgroundColor: "none",
        rightColumn: 4896,
        snapColumns: 64,
        detachFromLayout: true,
        widgetId: "0",
        topRow: 0,
        bottomRow: 640,
        containerStyle: "none",
        snapRows: 124,
        parentRowSpace: 1,
        type: "CANVAS_WIDGET",
        canExtend: true,
        version: 87,
        minHeight: 1292,
        dynamicTriggerPathList: [],
        parentColumnSpace: 1,
        dynamicBindingPathList: [],
        leftColumn: 0,
        children: ["76t6mkfckv", "30s2xz9lqx", "gz1wda6co5"],
      },
      "76t6mkfckv": {
        mobileBottomRow: 5,
        widgetName: "txt_pageTitle",
        displayName: "Text",
        iconSVG: "/static/media/icon.c3b6033f570046f8c6288d911333a827.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 1,
        bottomRow: 5,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 30,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 6.42333984375,
        dynamicTriggerPathList: [],
        leftColumn: 1,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "borderRadius",
          },
          {
            key: "fontFamily",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "Customer Information",
        key: "ph5glqkph7",
        isDeprecated: false,
        rightColumn: 22,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "76t6mkfckv",
        minWidth: 450,
        isVisible: true,
        fontStyle: "BOLD",
        textColor: "#101828",
        version: 1,
        parentId: "0",
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 1,
        responsiveBehavior: "fill",
        originalTopRow: 1,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 14,
        maxDynamicHeight: 9000,
        originalBottomRow: 5,
        fontSize: "1.25rem",
        minDynamicHeight: 4,
      },
      "30s2xz9lqx": {
        boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
        borderColor: "#E0DEDE",
        isVisibleDownload: true,
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.e6911f8bb94dc6c4a102a74740c41763.svg",
        topRow: 6,
        isSortable: true,
        type: "TABLE_WIDGET_V2",
        inlineEditingSaveOption: "ROW_LEVEL",
        animateLoading: true,
        dynamicBindingPathList: [
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
            key: "primaryColumns.id.computedValue",
          },
          {
            key: "primaryColumns.gender.computedValue",
          },
          {
            key: "primaryColumns.latitude.computedValue",
          },
          {
            key: "primaryColumns.longitude.computedValue",
          },
          {
            key: "primaryColumns.dob.computedValue",
          },
          {
            key: "primaryColumns.phone.computedValue",
          },
          {
            key: "primaryColumns.email.computedValue",
          },
          {
            key: "primaryColumns.image.computedValue",
          },
          {
            key: "primaryColumns.country.computedValue",
          },
          {
            key: "primaryColumns.name.computedValue",
          },
          {
            key: "primaryColumns.created_at.computedValue",
          },
          {
            key: "primaryColumns.updated_at.computedValue",
          },
          {
            key: "tableData",
          },
        ],
        needsHeightForContent: true,
        leftColumn: 1,
        delimiter: ",",
        defaultSelectedRowIndex: 0,
        accentColor: "{{appsmith.theme.colors.primaryColor}}",
        isVisibleFilters: true,
        isVisible: true,
        enableClientSideSearch: true,
        version: 2,
        totalRecordsCount: 0,
        tags: ["Suggested", "Display"],
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
        columnUpdatedAt: 1699355743847,
        originalBottomRow: 59,
        defaultSelectedRowIndices: [0],
        mobileBottomRow: 45,
        widgetName: "tbl_userInfo",
        defaultPageSize: 0,
        columnOrder: [
          "image",
          "name",
          "email",
          "phone",
          "id",
          "gender",
          "latitude",
          "longitude",
          "dob",
          "country",
          "created_at",
          "updated_at",
        ],
        dynamicPropertyPathList: [],
        displayName: "Table",
        bottomRow: 64,
        columnWidthMap: {
          id: 94,
          gender: 115,
          image: 85,
          name: 161,
        },
        parentRowSpace: 10,
        hideCard: false,
        mobileRightColumn: 35,
        parentColumnSpace: 18.880859375,
        dynamicTriggerPathList: [],
        borderWidth: "",
        primaryColumns: {
          id: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 0,
            width: 150,
            originalId: "id",
            id: "id",
            alias: "id",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "number",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: false,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "id",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["id"]))}}',
            sticky: "",
            validation: {},
          },
          gender: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 1,
            width: 150,
            originalId: "gender",
            id: "gender",
            alias: "gender",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: true,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "gender",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["gender"]))}}',
            sticky: "",
            validation: {},
          },
          latitude: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 2,
            width: 150,
            originalId: "latitude",
            id: "latitude",
            alias: "latitude",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: false,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "latitude",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["latitude"]))}}',
            sticky: "",
            validation: {},
          },
          longitude: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 3,
            width: 150,
            originalId: "longitude",
            id: "longitude",
            alias: "longitude",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: false,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "longitude",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["longitude"]))}}',
            sticky: "",
            validation: {},
          },
          dob: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 4,
            width: 150,
            originalId: "dob",
            id: "dob",
            alias: "dob",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "date",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: true,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "dob",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["dob"]))}}',
            sticky: "",
            validation: {},
            outputFormat: "DD/MM/YYYY",
          },
          phone: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 5,
            width: 150,
            originalId: "phone",
            id: "phone",
            alias: "phone",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: true,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "phone",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["phone"]))}}',
            sticky: "",
            validation: {},
          },
          email: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 6,
            width: 150,
            originalId: "email",
            id: "email",
            alias: "email",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: true,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "email",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["email"]))}}',
            sticky: "",
            validation: {},
          },
          image: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 7,
            width: 150,
            originalId: "image",
            id: "image",
            alias: "image",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "image",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: false,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "image",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["image"]))}}',
            sticky: "",
            validation: {},
          },
          country: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 8,
            width: 150,
            originalId: "country",
            id: "country",
            alias: "country",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: true,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "country",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["country"]))}}',
            sticky: "",
            validation: {},
          },
          name: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 9,
            width: 150,
            originalId: "name",
            id: "name",
            alias: "name",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: true,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "name",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["name"]))}}',
            sticky: "",
            validation: {},
          },
          created_at: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 10,
            width: 150,
            originalId: "created_at",
            id: "created_at",
            alias: "created_at",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: false,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "created_at",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["created_at"]))}}',
            sticky: "",
            validation: {},
          },
          updated_at: {
            allowCellWrapping: false,
            allowSameOptionsInNewRow: true,
            index: 11,
            width: 150,
            originalId: "updated_at",
            id: "updated_at",
            alias: "updated_at",
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textSize: "0.875rem",
            enableFilter: true,
            enableSort: true,
            isVisible: false,
            isDisabled: false,
            isCellEditable: false,
            isEditable: false,
            isCellVisible: true,
            isDerived: false,
            label: "updated_at",
            isSaveVisible: true,
            isDiscardVisible: true,
            computedValue:
              '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["updated_at"]))}}',
            sticky: "",
            validation: {},
          },
        },
        key: "1hz6z5p49i",
        canFreezeColumn: true,
        isDeprecated: false,
        rightColumn: 41,
        textSize: "0.875rem",
        widgetId: "30s2xz9lqx",
        enableServerSideFiltering: false,
        minWidth: 450,
        tableData: "{{getUsers.data}}",
        label: "Data",
        searchKey: "",
        parentId: "0",
        renderMode: "CANVAS",
        mobileTopRow: 17,
        horizontalAlignment: "LEFT",
        isVisibleSearch: true,
        responsiveBehavior: "fill",
        originalTopRow: 17,
        mobileLeftColumn: 1,
        isVisiblePagination: true,
        verticalAlignment: "CENTER",
      },
      ksqoq712gb: {
        widgetName: "txt_userFullName",
        displayName: "Text",
        iconSVG: "/static/media/icon.97c59b523e6f70ba6f40a10fc2c7c5b5.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 2,
        bottomRow: 6,
        type: "TEXT_WIDGET",
        hideCard: false,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        dynamicTriggerPathList: [],
        leftColumn: 18,
        dynamicBindingPathList: [
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "#FFC13D",
        text: "{{tbl_userInfo.selectedRow.name}}",
        key: "799bmivq9p",
        isDeprecated: false,
        rightColumn: 60,
        textAlign: "LEFT",
        dynamicHeight: "FIXED",
        widgetId: "ksqoq712gb",
        isVisible: true,
        fontStyle: "BOLD",
        textColor: "#231F20",
        version: 1,
        parentId: "1c72qpylh0",
        renderMode: "CANVAS",
        isLoading: false,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        maxDynamicHeight: 9000,
        fontSize: "1.25rem",
        minDynamicHeight: 4,
      },
      "2xoes8wilz": {
        mobileBottomRow: 9,
        widgetName: "txt_countryValue",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 30,
        bottomRow: 34,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 25,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "{{tbl_userInfo.selectedRow.country}}",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 62,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "2xoes8wilz",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#101828",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 30,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 34,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      av2rmb7w6k: {
        mobileBottomRow: 9,
        widgetName: "txt_updatedAtValue",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 50,
        bottomRow: 54,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 25,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "{{new Date(tbl_userInfo.selectedRow.updated_at).toDateString()}}",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 62,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "av2rmb7w6k",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#101828",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 50,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 54,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      "49fw3yiijl": {
        mobileBottomRow: 9,
        widgetName: "txt_createdAtValue",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 45,
        bottomRow: 49,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 25,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "{{new Date(tbl_userInfo.selectedRow.created_at).toDateString()}}",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 62,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "49fw3yiijl",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#101828",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 45,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 49,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      yrnf6ebevh: {
        mobileBottomRow: 9,
        widgetName: "txt_longitudeValue",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 40,
        bottomRow: 44,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 25,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "{{tbl_userInfo.selectedRow.longitude}}",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 62,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "yrnf6ebevh",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#101828",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 40,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 44,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      z5vabtkhbb: {
        mobileBottomRow: 9,
        widgetName: "txt_latitudeValue",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 35,
        bottomRow: 39,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 25,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "{{tbl_userInfo.selectedRow.latitude}}",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 62,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "z5vabtkhbb",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#101828",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 35,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 39,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      "308vo9jh63": {
        mobileBottomRow: 9,
        widgetName: "txt_phoneValue",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 25,
        bottomRow: 29,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 25,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "{{tbl_userInfo.selectedRow.phone}}",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 62,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "308vo9jh63",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#101828",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 25,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 29,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      "5qcop7cwtm": {
        mobileBottomRow: 9,
        widgetName: "txt_dobValue",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 19,
        bottomRow: 23,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 25,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "{{new Date(tbl_userInfo.selectedRow.dob).toDateString()}}",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 62,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "5qcop7cwtm",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#101828",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 19,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 24,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      oid24ma9vw: {
        mobileBottomRow: 9,
        widgetName: "txt_genderValue",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 14,
        bottomRow: 18,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 25,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "{{tbl_userInfo.selectedRow.gender}}",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 62,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "oid24ma9vw",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#101828",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 22,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 26,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      y4kqr6s084: {
        mobileBottomRow: 9,
        widgetName: "txt_userEmail",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 6,
        bottomRow: 10,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 18,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
          {
            key: "text",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "{{tbl_userInfo.selectedRow.email}}",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 61,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "y4kqr6s084",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#101828",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 6,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 11,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      u753uo6af8: {
        mobileBottomRow: 9,
        widgetName: "txt_country",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 30,
        bottomRow: 34,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 2,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "Country",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 25,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "u753uo6af8",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#71717a",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 34,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 38,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      gsgr0ynhbb: {
        mobileBottomRow: 9,
        widgetName: "txt_updatedAt",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 50,
        bottomRow: 54,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 2,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "Updated at",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 25,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "gsgr0ynhbb",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#71717a",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 34,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 38,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      "3etip5rg1a": {
        mobileBottomRow: 9,
        widgetName: "txt_createdAt",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 45,
        bottomRow: 49,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 2,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "Created at",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 25,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "3etip5rg1a",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#71717a",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 34,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 38,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      "81esy5jfi0": {
        mobileBottomRow: 9,
        widgetName: "txt_longitude",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 40,
        bottomRow: 44,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 2,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "Longitude",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 25,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "81esy5jfi0",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#71717a",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 34,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 38,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      z5j3zsmu38: {
        mobileBottomRow: 9,
        widgetName: "txt_latitude",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 35,
        bottomRow: 39,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 2,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "Latitude",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 25,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "z5j3zsmu38",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#71717a",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 34,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 38,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      v03001ino4: {
        mobileBottomRow: 9,
        widgetName: "txt_phone",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 25,
        bottomRow: 29,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 2,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "Phone Number",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 25,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "v03001ino4",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#71717a",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 29,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 33,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      z434i5dlb7: {
        mobileBottomRow: 9,
        widgetName: "txt_dob",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 19,
        bottomRow: 23,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 2,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "Date of Birth",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 25,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "z434i5dlb7",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#71717a",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 25,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 29,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      "4hqs7tr225": {
        mobileBottomRow: 9,
        widgetName: "txt_gender",
        displayName: "Text",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
        searchTags: ["typography", "paragraph", "label"],
        topRow: 14,
        bottomRow: 18,
        parentRowSpace: 10,
        type: "TEXT_WIDGET",
        hideCard: false,
        mobileRightColumn: 18,
        animateLoading: true,
        overflow: "NONE",
        fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 2,
        dynamicBindingPathList: [
          {
            key: "truncateButtonColor",
          },
          {
            key: "fontFamily",
          },
          {
            key: "borderRadius",
          },
        ],
        shouldTruncate: false,
        truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
        text: "Gender",
        key: "jl31nlbh5s",
        isDeprecated: false,
        rightColumn: 25,
        textAlign: "LEFT",
        dynamicHeight: "AUTO_HEIGHT",
        widgetId: "4hqs7tr225",
        minWidth: 450,
        isVisible: true,
        fontStyle: "",
        textColor: "#71717a",
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Suggested", "Content"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 5,
        responsiveBehavior: "fill",
        originalTopRow: 21,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 2,
        maxDynamicHeight: 9000,
        originalBottomRow: 25,
        fontSize: "1rem",
        minDynamicHeight: 4,
      },
      "6st25auvr3": {
        mobileBottomRow: 8,
        widgetName: "div_detailDivider",
        thickness: 2,
        displayName: "Divider",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.3b7d47d7bd70da418a827287042cbb7f.svg",
        searchTags: ["line"],
        topRow: 10,
        bottomRow: 14,
        parentRowSpace: 10,
        type: "DIVIDER_WIDGET",
        capType: "nc",
        hideCard: false,
        mobileRightColumn: 38,
        animateLoading: true,
        parentColumnSpace: 5.5732421875,
        dynamicTriggerPathList: [],
        leftColumn: 2,
        dynamicBindingPathList: [],
        key: "e0sxfu5i3g",
        dividerColor: "#f4f4f5",
        orientation: "horizontal",
        strokeStyle: "solid",
        isDeprecated: false,
        rightColumn: 61,
        widgetId: "6st25auvr3",
        capSide: 0,
        minWidth: 450,
        isVisible: true,
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Layout"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 4,
        responsiveBehavior: "fill",
        originalTopRow: 12,
        mobileLeftColumn: 18,
        originalBottomRow: 16,
      },
      jf6mghk92c: {
        boxShadow: "none",
        mobileBottomRow: 13,
        widgetName: "img_userImage",
        displayName: "Image",
        iconSVG:
          "https://appcdn.appsmith.com/static/media/icon.69b0f0dd810281fbd6e34fc2c3f39344.svg",
        topRow: 1,
        bottomRow: 10,
        parentRowSpace: 10,
        type: "IMAGE_WIDGET",
        hideCard: false,
        mobileRightColumn: 11,
        animateLoading: true,
        parentColumnSpace: 5.56884765625,
        dynamicTriggerPathList: [],
        imageShape: "RECTANGLE",
        leftColumn: 2,
        dynamicBindingPathList: [
          {
            key: "borderRadius",
          },
          {
            key: "image",
          },
        ],
        defaultImage: "https://assets.appsmith.com/widgets/default.png",
        key: "0pndua8j2k",
        image: "{{tbl_userInfo.selectedRow.image}}",
        isDeprecated: false,
        rightColumn: 18,
        objectFit: "contain",
        widgetId: "jf6mghk92c",
        isVisible: true,
        version: 1,
        parentId: "1c72qpylh0",
        tags: ["Media"],
        renderMode: "CANVAS",
        isLoading: false,
        mobileTopRow: 1,
        maxZoomLevel: 1,
        enableDownload: false,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        mobileLeftColumn: 0,
        enableRotation: false,
      },
      "1c72qpylh0": {
        boxShadow: "none",
        widgetName: "Canvas4CopyCopy",
        displayName: "Canvas",
        topRow: 0,
        bottomRow: 580,
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
          "ksqoq712gb",
          "2xoes8wilz",
          "av2rmb7w6k",
          "49fw3yiijl",
          "yrnf6ebevh",
          "z5vabtkhbb",
          "308vo9jh63",
          "5qcop7cwtm",
          "oid24ma9vw",
          "y4kqr6s084",
          "u753uo6af8",
          "gsgr0ynhbb",
          "3etip5rg1a",
          "81esy5jfi0",
          "z5j3zsmu38",
          "v03001ino4",
          "z434i5dlb7",
          "4hqs7tr225",
          "6st25auvr3",
          "jf6mghk92c",
        ],
        key: "tju5wikk1m",
        isDeprecated: false,
        rightColumn: 436.5,
        detachFromLayout: true,
        widgetId: "1c72qpylh0",
        accentColor: "{{appsmith.theme.colors.primaryColor}}",
        containerStyle: "none",
        isVisible: true,
        version: 1,
        parentId: "gz1wda6co5",
        renderMode: "CANVAS",
        isLoading: false,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
      },
      gz1wda6co5: {
        boxShadow:
          "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        widgetName: "con_userDetails",
        isCanvas: true,
        displayName: "Form",
        iconSVG: "/static/media/icon.ea3e08d130e59c56867ae40114c10eed.svg",
        searchTags: ["group"],
        topRow: 6,
        bottomRow: 64,
        parentRowSpace: 10,
        type: "FORM_WIDGET",
        hideCard: false,
        shouldScrollContents: true,
        animateLoading: true,
        parentColumnSpace: 18.1875,
        dynamicTriggerPathList: [],
        leftColumn: 41,
        dynamicBindingPathList: [
          {
            key: "borderRadius",
          },
        ],
        children: ["1c72qpylh0"],
        key: "b2g4hzss2y",
        backgroundColor: "#FFFFFF",
        isDeprecated: false,
        rightColumn: 63,
        dynamicHeight: "FIXED",
        widgetId: "gz1wda6co5",
        isVisible: true,
        parentId: "0",
        renderMode: "CANVAS",
        isLoading: false,
        borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
        maxDynamicHeight: 9000,
        minDynamicHeight: 10,
      },
    },
    canvasWidgetsStructure: {
      bottomRow: 640,
      children: [
        {
          bottomRow: 5,
          parentId: "0",
          topRow: 1,
          type: "TEXT_WIDGET",
          widgetId: "76t6mkfckv",
          children: [],
        },
        {
          bottomRow: 64,
          parentId: "0",
          topRow: 6,
          type: "TABLE_WIDGET_V2",
          widgetId: "30s2xz9lqx",
          children: [],
        },
        {
          bottomRow: 64,
          children: [
            {
              bottomRow: 580,
              children: [
                {
                  bottomRow: 6,
                  parentId: "1c72qpylh0",
                  topRow: 2,
                  type: "TEXT_WIDGET",
                  widgetId: "ksqoq712gb",
                  children: [],
                },
                {
                  bottomRow: 34,
                  parentId: "1c72qpylh0",
                  topRow: 30,
                  type: "TEXT_WIDGET",
                  widgetId: "2xoes8wilz",
                  children: [],
                },
                {
                  bottomRow: 54,
                  parentId: "1c72qpylh0",
                  topRow: 50,
                  type: "TEXT_WIDGET",
                  widgetId: "av2rmb7w6k",
                  children: [],
                },
                {
                  bottomRow: 49,
                  parentId: "1c72qpylh0",
                  topRow: 45,
                  type: "TEXT_WIDGET",
                  widgetId: "49fw3yiijl",
                  children: [],
                },
                {
                  bottomRow: 44,
                  parentId: "1c72qpylh0",
                  topRow: 40,
                  type: "TEXT_WIDGET",
                  widgetId: "yrnf6ebevh",
                  children: [],
                },
                {
                  bottomRow: 39,
                  parentId: "1c72qpylh0",
                  topRow: 35,
                  type: "TEXT_WIDGET",
                  widgetId: "z5vabtkhbb",
                  children: [],
                },
                {
                  bottomRow: 29,
                  parentId: "1c72qpylh0",
                  topRow: 25,
                  type: "TEXT_WIDGET",
                  widgetId: "308vo9jh63",
                  children: [],
                },
                {
                  bottomRow: 23,
                  parentId: "1c72qpylh0",
                  topRow: 19,
                  type: "TEXT_WIDGET",
                  widgetId: "5qcop7cwtm",
                  children: [],
                },
                {
                  bottomRow: 18,
                  parentId: "1c72qpylh0",
                  topRow: 14,
                  type: "TEXT_WIDGET",
                  widgetId: "oid24ma9vw",
                  children: [],
                },
                {
                  bottomRow: 10,
                  parentId: "1c72qpylh0",
                  topRow: 6,
                  type: "TEXT_WIDGET",
                  widgetId: "y4kqr6s084",
                  children: [],
                },
                {
                  bottomRow: 34,
                  parentId: "1c72qpylh0",
                  topRow: 30,
                  type: "TEXT_WIDGET",
                  widgetId: "u753uo6af8",
                  children: [],
                },
                {
                  bottomRow: 54,
                  parentId: "1c72qpylh0",
                  topRow: 50,
                  type: "TEXT_WIDGET",
                  widgetId: "gsgr0ynhbb",
                  children: [],
                },
                {
                  bottomRow: 49,
                  parentId: "1c72qpylh0",
                  topRow: 45,
                  type: "TEXT_WIDGET",
                  widgetId: "3etip5rg1a",
                  children: [],
                },
                {
                  bottomRow: 44,
                  parentId: "1c72qpylh0",
                  topRow: 40,
                  type: "TEXT_WIDGET",
                  widgetId: "81esy5jfi0",
                  children: [],
                },
                {
                  bottomRow: 39,
                  parentId: "1c72qpylh0",
                  topRow: 35,
                  type: "TEXT_WIDGET",
                  widgetId: "z5j3zsmu38",
                  children: [],
                },
                {
                  bottomRow: 29,
                  parentId: "1c72qpylh0",
                  topRow: 25,
                  type: "TEXT_WIDGET",
                  widgetId: "v03001ino4",
                  children: [],
                },
                {
                  bottomRow: 23,
                  parentId: "1c72qpylh0",
                  topRow: 19,
                  type: "TEXT_WIDGET",
                  widgetId: "z434i5dlb7",
                  children: [],
                },
                {
                  bottomRow: 18,
                  parentId: "1c72qpylh0",
                  topRow: 14,
                  type: "TEXT_WIDGET",
                  widgetId: "4hqs7tr225",
                  children: [],
                },
                {
                  bottomRow: 14,
                  parentId: "1c72qpylh0",
                  topRow: 10,
                  type: "DIVIDER_WIDGET",
                  widgetId: "6st25auvr3",
                  children: [],
                },
                {
                  bottomRow: 10,
                  parentId: "1c72qpylh0",
                  topRow: 1,
                  type: "IMAGE_WIDGET",
                  widgetId: "jf6mghk92c",
                  children: [],
                },
              ],
              parentId: "gz1wda6co5",
              topRow: 0,
              type: "CANVAS_WIDGET",
              widgetId: "1c72qpylh0",
            },
          ],
          parentId: "0",
          topRow: 6,
          type: "FORM_WIDGET",
          widgetId: "gz1wda6co5",
        },
      ],
      topRow: 0,
      type: "CANVAS_WIDGET",
      widgetId: "0",
    },
    metaWidgets: {},
    actions: [
      {
        isLoading: false,
        config: {
          id: "659f81c8d0cbfb0c5e0a743e",
          applicationId: "659f81c8d0cbfb0c5e0a7439",
          workspaceId: "659d2e14d0cbfb0c5e0a7424",
          pluginType: "DB",
          pluginId: "653236205e9a6424e4c04b51",
          name: "getUsers",
          datasource: {
            id: "659f81c8d0cbfb0c5e0a743c",
            userPermissions: [],
            name: "users",
            pluginId: "653236205e9a6424e4c04b51",
            datasourceStorages: {},
            messages: [],
            isValid: true,
            new: false,
          },
          pageId: "659f81c8d0cbfb0c5e0a743b",
          actionConfiguration: {
            timeoutInMillisecond: 10000,
            paginationType: "NONE",
            encodeParamsToggle: true,
            body: 'SELECT * FROM public."users";',
            selfReferencingDataPaths: [],
            pluginSpecifiedTemplates: [
              {
                value: true,
              },
            ],
          },
          executeOnLoad: true,
          runBehavior: "PAGE_LOAD",
          dynamicBindingPathList: [],
          isValid: true,
          invalids: [],
          messages: [],
          jsonPathKeys: [],
          confirmBeforeExecute: false,
          userPermissions: [
            "read:actions",
            "delete:actions",
            "execute:actions",
            "manage:actions",
          ],
          validName: "getUsers",
          entityReferenceType: "ACTION",
          selfReferencingDataPaths: [],
        },
      },
      {
        isLoading: false,
        config: {
          id: "659fec82d0cbfb0c5e0a745b",
          applicationId: "659f81c8d0cbfb0c5e0a7439",
          workspaceId: "659d2e14d0cbfb0c5e0a7424",
          pluginType: "DB",
          pluginId: "653236205e9a6424e4c04b53",
          name: "Query1",
          datasource: {
            id: "659febdcd0cbfb0c5e0a7457",
            userPermissions: [],
            name: "Movies",
            pluginId: "653236205e9a6424e4c04b53",
            datasourceStorages: {},
            messages: [],
            isValid: true,
            new: false,
          },
          pageId: "659f81c8d0cbfb0c5e0a743b",
          actionConfiguration: {
            timeoutInMillisecond: 10000,
            paginationType: "NONE",
            encodeParamsToggle: true,
            selfReferencingDataPaths: [],
            formData: {
              command: {
                data: "FIND",
              },
              aggregate: {
                limit: {
                  data: "10",
                },
              },
              delete: {
                limit: {
                  data: "SINGLE",
                },
              },
              updateMany: {
                limit: {
                  data: "SINGLE",
                },
              },
              smartSubstitution: {
                data: true,
              },
              find: {
                query: {
                  data: '{ "homepage": "https://movies.disney.com/cruella"}',
                },
                limit: {
                  data: "10",
                },
                sort: {
                  data: '{"_id": 1}',
                },
              },
              collection: {
                data: "movies",
              },
              body: {
                data: '{\n  "find": "movies",\n  "filter": {\n    "homepage": "https://movies.disney.com/cruella"\n  },\n  "sort": {\n    "_id": 1\n  },\n  "limit": 10\n}\n',
              },
            },
          },
          executeOnLoad: false,
          runBehavior: "MANUAL",
          isValid: true,
          invalids: [],
          messages: [],
          jsonPathKeys: [],
          confirmBeforeExecute: false,
          userPermissions: [
            "read:actions",
            "delete:actions",
            "execute:actions",
            "manage:actions",
          ],
          eventData: {},
          validName: "Query1",
          entityReferenceType: "ACTION",
          selfReferencingDataPaths: [],
        },
      },
    ],
    datasources: {
      list: [
        {
          id: "659febdcd0cbfb0c5e0a7457",
          userPermissions: [
            "execute:datasources",
            "delete:datasources",
            "manage:datasources",
            "read:datasources",
          ],
          name: "Movies",
          pluginId: "653236205e9a6424e4c04b53",
          workspaceId: "659d2e14d0cbfb0c5e0a7424",
          datasourceStorages: {
            unused_env: {
              id: "659febdcd0cbfb0c5e0a7458",
              datasourceId: "659febdcd0cbfb0c5e0a7457",
              environmentId: UNUSED_ENV_ID,
              datasourceConfiguration: {
                connection: {
                  mode: "READ_WRITE",
                  type: "DIRECT",
                  ssl: {
                    authType: "DEFAULT",
                  },
                },
                authentication: {
                  authenticationType: "dbAuth",
                  authType: "SCRAM_SHA_1",
                  username: "mockdb-admin",
                  databaseName: "movies",
                },
                properties: [
                  {
                    key: "Use mongo connection string URI",
                    value: "Yes",
                  },
                  {
                    key: "Connection string URI",
                    value:
                      "mongodb+srv://mockdb-admin:****@mockdb.kce5o.mongodb.net/movies?w=majority&retrywrites=true&authsource=admin&minpoolsize=0",
                  },
                ],
              },
              isConfigured: true,
              invalids: [],
              messages: [],
              isValid: true,
            },
          },
          invalids: [],
          messages: [],
          isRecentlyCreated: true,
          isMock: true,
          isValid: true,
          new: false,
        },
        {
          id: "659f81c8d0cbfb0c5e0a743c",
          userPermissions: [
            "execute:datasources",
            "delete:datasources",
            "manage:datasources",
            "read:datasources",
          ],
          name: "users",
          pluginId: "653236205e9a6424e4c04b51",
          workspaceId: "659d2e14d0cbfb0c5e0a7424",
          datasourceStorages: {
            unused_env: {
              id: "659f81c8d0cbfb0c5e0a743d",
              datasourceId: "659f81c8d0cbfb0c5e0a743c",
              environmentId: UNUSED_ENV_ID,
              datasourceConfiguration: {
                connection: {
                  mode: "READ_WRITE",
                  ssl: {
                    authType: "DEFAULT",
                  },
                },
                endpoints: [
                  {
                    host: "mockdb.internal.appsmith.com",
                  },
                ],
                authentication: {
                  authenticationType: "dbAuth",
                  username: "users",
                  databaseName: "users",
                },
              },
              isConfigured: true,
              invalids: [],
              messages: [],
              isValid: true,
            },
          },
          invalids: [],
          messages: [],
          isRecentlyCreated: true,
          isTemplate: true,
          isMock: true,
          isValid: true,
          new: false,
        },
      ],
      loading: false,
      isTesting: false,
      isListing: false,
      fetchingDatasourceStructure: {
        "659febdcd0cbfb0c5e0a7457": false,
        "659f81c8d0cbfb0c5e0a743c": false,
      },
      structure: {
        "659f81c8d0cbfb0c5e0a743c": {
          tables: [
            {
              type: "TABLE",
              schema: "public",
              name: "public.users",
              columns: [
                {
                  name: "id",
                  type: "int4",
                  defaultValue: "nextval('users_id_seq'::regclass)",
                  isAutogenerated: true,
                },
                {
                  name: "gender",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "latitude",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "longitude",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "dob",
                  type: "timestamptz",
                  isAutogenerated: false,
                },
                {
                  name: "phone",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "email",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "image",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "country",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "name",
                  type: "text",
                  isAutogenerated: false,
                },
                {
                  name: "created_at",
                  type: "timestamp",
                  isAutogenerated: false,
                },
                {
                  name: "updated_at",
                  type: "timestamp",
                  isAutogenerated: false,
                },
              ],
              keys: [
                {
                  name: "users_pkey",
                  columnNames: ["id"],
                  type: "primary key",
                },
              ],
              templates: [
                {
                  title: "SELECT",
                  body: 'SELECT * FROM public."users" LIMIT 10;',
                  suggested: true,
                },
                {
                  title: "INSERT",
                  body: 'INSERT INTO public."users" ("gender", "latitude", "longitude", "dob", "phone", "email", "image", "country", "name", "created_at", "updated_at")\n  VALUES (\'\', \'\', \'\', TIMESTAMP WITH TIME ZONE \'2019-07-01 06:30:00 CET\', \'\', \'\', \'\', \'\', \'\', TIMESTAMP \'2019-07-01 10:00:00\', TIMESTAMP \'2019-07-01 10:00:00\');',
                  suggested: false,
                },
                {
                  title: "UPDATE",
                  body: 'UPDATE public."users" SET\n    "gender" = \'\',\n    "latitude" = \'\',\n    "longitude" = \'\',\n    "dob" = TIMESTAMP WITH TIME ZONE \'2019-07-01 06:30:00 CET\',\n    "phone" = \'\',\n    "email" = \'\',\n    "image" = \'\',\n    "country" = \'\',\n    "name" = \'\',\n    "created_at" = TIMESTAMP \'2019-07-01 10:00:00\',\n    "updated_at" = TIMESTAMP \'2019-07-01 10:00:00\'\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may update every row in the table!',
                  suggested: false,
                },
                {
                  title: "DELETE",
                  body: 'DELETE FROM public."users"\n  WHERE 1 = 0; -- Specify a valid condition here. Removing the condition may delete everything in the table!',
                  suggested: false,
                },
              ],
            },
          ],
        },
        "659febdcd0cbfb0c5e0a7457": {
          tables: [
            {
              type: "COLLECTION",
              name: "movies",
              columns: [
                {
                  name: "_id",
                  type: "ObjectId",
                  isAutogenerated: true,
                },
                {
                  name: "genres",
                  type: "Array",
                  isAutogenerated: false,
                },
                {
                  name: "homepage",
                  type: "String",
                  isAutogenerated: false,
                },
                {
                  name: "imdb_id",
                  type: "String",
                  isAutogenerated: false,
                },
                {
                  name: "poster_path",
                  type: "String",
                  isAutogenerated: false,
                },
                {
                  name: "release_date",
                  type: "String",
                  isAutogenerated: false,
                },
                {
                  name: "revenue",
                  type: "Integer",
                  isAutogenerated: false,
                },
                {
                  name: "status",
                  type: "String",
                  isAutogenerated: false,
                },
                {
                  name: "tagline",
                  type: "String",
                  isAutogenerated: false,
                },
                {
                  name: "title",
                  type: "String",
                  isAutogenerated: false,
                },
                {
                  name: "vote_average",
                  type: "Double",
                  isAutogenerated: false,
                },
                {
                  name: "vote_count",
                  type: "Integer",
                  isAutogenerated: false,
                },
              ],
              keys: [],
              templates: [
                {
                  title: "Find",
                  configuration: {
                    find: {
                      query: {
                        data: '{ "homepage": "https://movies.disney.com/cruella"}',
                      },
                      limit: {
                        data: "10",
                      },
                      sort: {
                        data: '{"_id": 1}',
                      },
                    },
                    collection: {
                      data: "movies",
                    },
                    body: {
                      data: '{\n  "find": "movies",\n  "filter": {\n    "homepage": "https://movies.disney.com/cruella"\n  },\n  "sort": {\n    "_id": 1\n  },\n  "limit": 10\n}\n',
                    },
                    command: {
                      data: "FIND",
                    },
                    smartSubstitution: {
                      data: true,
                    },
                  },
                  suggested: true,
                },
                {
                  title: "Find by ID",
                  configuration: {
                    find: {
                      query: {
                        data: '{"_id": ObjectId("id_to_query_with")}',
                      },
                    },
                    collection: {
                      data: "movies",
                    },
                    body: {
                      data: '{\n  "find": "movies",\n  "filter": {\n    "_id": ObjectId("id_to_query_with")\n  }\n}\n',
                    },
                    command: {
                      data: "FIND",
                    },
                    smartSubstitution: {
                      data: true,
                    },
                  },
                  suggested: false,
                },
                {
                  title: "Insert",
                  configuration: {
                    insert: {
                      documents: {
                        data: '[{      "_id": ObjectId("a_valid_object_id_hex"),\n      "genres": [1, 2, 3],\n      "homepage": "new value",\n      "imdb_id": "new value",\n      "poster_path": "new value",\n      "release_date": "new value",\n      "revenue": 1,\n      "status": "new value",\n      "tagline": "new value",\n      "title": "new value",\n      "vote_average": 1,\n      "vote_count": 1,\n}]',
                      },
                    },
                    collection: {
                      data: "movies",
                    },
                    body: {
                      data: '{\n  "insert": "movies",\n  "documents": [\n    {\n      "_id": ObjectId("a_valid_object_id_hex"),\n      "genres": [1, 2, 3],\n      "homepage": "new value",\n      "imdb_id": "new value",\n      "poster_path": "new value",\n      "release_date": "new value",\n      "revenue": 1,\n      "status": "new value",\n      "tagline": "new value",\n      "title": "new value",\n      "vote_average": 1,\n      "vote_count": 1,\n    }\n  ]\n}\n',
                    },
                    command: {
                      data: "INSERT",
                    },
                    smartSubstitution: {
                      data: true,
                    },
                  },
                  suggested: false,
                },
                {
                  title: "Update",
                  configuration: {
                    updateMany: {
                      query: {
                        data: '{ "_id": ObjectId("id_of_document_to_update") }',
                      },
                      limit: {
                        data: "ALL",
                      },
                      update: {
                        data: '{ "$set": { "homepage": "new value" } }',
                      },
                    },
                    collection: {
                      data: "movies",
                    },
                    body: {
                      data: '{\n  "update": "movies",\n  "updates": [\n    {\n      "q": {\n        "_id": ObjectId("id_of_document_to_update")\n      },\n      "u": { "$set": { "homepage": "new value" } }\n    }\n  ]\n}\n',
                    },
                    command: {
                      data: "UPDATE",
                    },
                    smartSubstitution: {
                      data: true,
                    },
                  },
                  suggested: false,
                },
                {
                  title: "Delete",
                  configuration: {
                    collection: {
                      data: "movies",
                    },
                    body: {
                      data: '{\n  "delete": "movies",\n  "deletes": [\n    {\n      "q": {\n        "_id": "id_of_document_to_delete"\n      },\n      "limit": 1\n    }\n  ]\n}\n',
                    },
                    delete: {
                      query: {
                        data: '{ "_id": ObjectId("id_of_document_to_delete") }',
                      },
                      limit: {
                        data: "SINGLE",
                      },
                    },
                    command: {
                      data: "DELETE",
                    },
                    smartSubstitution: {
                      data: true,
                    },
                  },
                  suggested: false,
                },
                {
                  title: "Count",
                  configuration: {
                    count: {
                      query: {
                        data: '{"_id": {"$exists": true}}',
                      },
                    },
                    collection: {
                      data: "movies",
                    },
                    body: {
                      data: '{\n  "count": "movies",\n  "query": {"_id": {"$exists": true}} \n}\n',
                    },
                    command: {
                      data: "COUNT",
                    },
                    smartSubstitution: {
                      data: true,
                    },
                  },
                  suggested: false,
                },
                {
                  title: "Distinct",
                  configuration: {
                    distinct: {
                      query: {
                        data: '{ "_id": ObjectId("id_of_document_to_distinct") }',
                      },
                      key: {
                        data: "_id",
                      },
                    },
                    collection: {
                      data: "movies",
                    },
                    body: {
                      data: '{\n  "distinct": "movies",\n  "query": { "_id": ObjectId("id_of_document_to_distinct") },  "key": "_id",}\n',
                    },
                    command: {
                      data: "DISTINCT",
                    },
                    smartSubstitution: {
                      data: true,
                    },
                  },
                  suggested: false,
                },
                {
                  title: "Aggregate",
                  configuration: {
                    collection: {
                      data: "movies",
                    },
                    body: {
                      data: '{\n  "aggregate": "movies",\n  "pipeline": [ {"$sort" : {"_id": 1} } ],\n  "limit": 10,\n  "explain": "true"\n}\n',
                    },
                    command: {
                      data: "AGGREGATE",
                    },
                    smartSubstitution: {
                      data: true,
                    },
                    aggregate: {
                      arrayPipelines: {
                        data: '[ {"$sort" : {"_id": 1} } ]',
                      },
                      limit: {
                        data: "10",
                      },
                    },
                  },
                  suggested: false,
                },
              ],
            },
          ],
        },
      },
      isFetchingMockDataSource: false,
      mockDatasourceList: [
        {
          pluginType: "db",
          packageName: "mongo-plugin",
          description: "This contains a standard movies collection",
          name: "Movies",
        },
        {
          pluginType: "db",
          packageName: "postgres-plugin",
          description: "This contains a standard users information",
          name: "Users",
        },
      ],
      executingDatasourceQuery: false,
      isReconnectingModalOpen: false,
      unconfiguredList: [],
      isDatasourceBeingSaved: false,
      isDatasourceBeingSavedFromPopup: false,
      gsheetToken: "",
      gsheetProjectID: "",
      gsheetStructure: {
        spreadsheets: {},
        sheets: {},
        columns: {},
        isFetchingSpreadsheets: false,
        isFetchingSheets: false,
        isFetchingColumns: false,
      },
      recentDatasources: [],
    },
    pageList: {
      pages: [
        {
          pageName: "Home",
          pageId: "659f81c8d0cbfb0c5e0a743b",
          isDefault: true,
          isHidden: false,
          slug: "home",
          userPermissions: [
            "read:pages",
            "manage:pages",
            "create:pageActions",
            "delete:pages",
          ],
        },
      ],
      isGeneratingTemplatePage: false,
      applicationId: "659f81c8d0cbfb0c5e0a7439",
      currentPageId: "659f81c8d0cbfb0c5e0a743b",
      defaultPageId: "659f81c8d0cbfb0c5e0a743b",
      loading: {},
    },
    jsExecutions: {},
    plugins: {
      list: [
        {
          id: "653236205e9a6424e4c04b51",
          userPermissions: [],
          name: "PostgreSQL",
          type: "DB",
          packageName: "postgres-plugin",
          iconLocation: "https://assets.appsmith.com/logo/postgresql.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-postgres#create-crud-queries",
          responseType: "TABLE",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          generateCRUDPageComponent: "PostgreSQL",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {
            CREATE:
              "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    {{ nameInput.text }},\n    {{ genderDropdown.selectedOptionValue }},\n    {{ emailInput.text }}\n  );",
            SELECT:
              "SELECT * FROM <<your_table_name>> LIMIT 10;\n\n-- Please enter a valid table name and hit RUN",
            UPDATE:
              "UPDATE users\n  SET status = 'APPROVED'\n  WHERE id = {{ usersTable.selectedRow.id }};\n",
            DELETE: "DELETE FROM users WHERE id = -1;",
          },
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236205e9a6424e4c04b52",
          userPermissions: [],
          name: "REST API",
          type: "API",
          packageName: "restapi-plugin",
          iconLocation: "https://assets.appsmith.com/RestAPI.png",
          uiComponent: "ApiEditorForm",
          datasourceComponent: "RestAPIDatasourceForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236205e9a6424e4c04b53",
          userPermissions: [],
          name: "MongoDB",
          type: "DB",
          packageName: "mongo-plugin",
          iconLocation: "https://assets.appsmith.com/logo/mongodb.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-mongodb#create-queries",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "AutoForm",
          generateCRUDPageComponent: "MongoDB",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {
            CREATE:
              '{\n  "insert": "users",\n  "documents": [\n    {\n      "name": "{{ nameInput.text }}",\n      "email": "{{ emailInput.text }}",\n      "gender": "{{ genderDropdown.selectedOptionValue }}"\n    }\n  ]\n}\n',
            READ: '{\n  "find": "users",\n  "filter": {\n    "status": "{{ statusDropdown.selectedOptionValue }}"\n  },\n  "sort": {\n    "id": 1\n  },\n  "limit": 10\n}',
            UPDATE:
              '{\n  "update": "users",\n  "updates": [\n    {\n      "q": {\n        "id": 10\n      },\n      "u": { "$set": { "status": "{{ statusDropdown.selectedOptionValue }}" } }\n    }\n  ]\n}\n',
            DELETE:
              '{\n  "delete": "users",\n  "deletes": [\n    {\n      "q": {\n        "id": "{{ usersTable.selectedRow.id }}"\n      },\n      "limit": 1\n    }\n  ]\n}\n',
          },
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b55",
          userPermissions: [],
          name: "MySQL",
          type: "DB",
          packageName: "mysql-plugin",
          iconLocation: "https://assets.appsmith.com/logo/mysql.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-mysql#create-queries",
          responseType: "TABLE",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          generateCRUDPageComponent: "SQL",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {
            CREATE:
              "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    {{ nameInput.text }},\n    {{ genderDropdown.selectedOptionValue }},\n    {{ emailInput.text }}\n  );",
            SELECT:
              "SELECT * FROM <<your_table_name>> LIMIT 10\n\n-- Please enter a valid table name and hit RUN\n",
            UPDATE:
              "UPDATE users\n  SET status = 'APPROVED'\n  WHERE id = {{ usersTable.selectedRow.id }};",
            DELETE: "DELETE FROM users WHERE id = -1;",
          },
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b58",
          userPermissions: [],
          name: "Elasticsearch",
          type: "DB",
          packageName: "elasticsearch-plugin",
          iconLocation: "https://assets.appsmith.com/logo/elastic.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-elasticsearch#querying-elasticsearch",
          responseType: "JSON",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b59",
          userPermissions: [],
          name: "DynamoDB",
          type: "DB",
          packageName: "dynamo-plugin",
          iconLocation: "https://assets.appsmith.com/logo/aws-dynamodb.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-dynamodb#create-queries",
          responseType: "JSON",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5a",
          userPermissions: [],
          name: "Redis",
          type: "DB",
          packageName: "redis-plugin",
          iconLocation: "https://assets.appsmith.com/logo/redis.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-redis#querying-redis",
          responseType: "TABLE",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5b",
          userPermissions: [],
          name: "Microsoft SQL Server",
          type: "DB",
          packageName: "mssql-plugin",
          iconLocation: "https://assets.appsmith.com/logo/mssql.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-mssql#create-queries",
          responseType: "TABLE",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          generateCRUDPageComponent: "SQL",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {
            CREATE:
              "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    {{ nameInput.text }},\n    {{ genderDropdown.selectedOptionValue }},\n    {{ emailInput.text }}\n  );\n",
            SELECT:
              "SELECT TOP 10 * FROM <<your_table_name>>;\n\n-- Please enter a valid table name and hit RUN",
            UPDATE:
              "UPDATE users\n  SET status = 'APPROVED'\n  WHERE id = {{ usersTable.selectedRow.id }};\n",
            DELETE:
              "DELETE FROM users WHERE id = {{ usersTable.selectedRow.id }};\n",
          },
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5c",
          userPermissions: [],
          name: "Firestore",
          type: "DB",
          packageName: "firestore-plugin",
          iconLocation: "https://assets.appsmith.com/logo/firestore.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-firestore#understanding-commands",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "AutoForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5d",
          userPermissions: [],
          name: "Redshift",
          type: "DB",
          packageName: "redshift-plugin",
          iconLocation: "https://assets.appsmith.com/logo/aws-redshift.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-redshift#querying-redshift",
          responseType: "TABLE",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          generateCRUDPageComponent: "SQL",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5e",
          userPermissions: [],
          name: "S3",
          type: "DB",
          packageName: "amazons3-plugin",
          iconLocation: "https://assets.appsmith.com/logo/aws-s3.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-amazon-s3#list-files",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "AutoForm",
          generateCRUDPageComponent: "S3",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5f",
          userPermissions: [],
          name: "Google Sheets",
          type: "SAAS",
          packageName: "google-sheets-plugin",
          pluginName: "google-sheets-plugin",
          iconLocation: "https://assets.appsmith.com/GoogleSheets.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-google-sheets#create-queries",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "OAuth2DatasourceForm",
          generateCRUDPageComponent: "Google Sheets",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b61",
          userPermissions: [],
          name: "Snowflake",
          type: "DB",
          packageName: "snowflake-plugin",
          iconLocation: "https://assets.appsmith.com/logo/snowflake.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-snowflake-db#querying-snowflake",
          responseType: "TABLE",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          generateCRUDPageComponent: "SQL",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {
            CREATE:
              "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    '{{ nameInput.text }}',\n    '{{ genderDropdown.selectedOptionValue }}',\n    '{{ emailInput.text }}'\n  );",
            SELECT:
              "SELECT * FROM <<your_table_name>> LIMIT 10;\n\n-- Please enter a valid table name and hit RUN",
            UPDATE:
              "UPDATE users\n  SET status = 'APPROVED'\n  WHERE id = '{{ usersTable.selectedRow.id }}';",
            DELETE: "DELETE FROM users WHERE id = -1;",
          },
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b62",
          userPermissions: [],
          name: "ArangoDB",
          type: "DB",
          packageName: "arangodb-plugin",
          iconLocation: "https://assets.appsmith.com/logo/arangodb.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-arango-db#using-queries-in-applications",
          responseType: "TABLE",
          uiComponent: "DbEditorForm",
          datasourceComponent: "AutoForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {
            CREATE:
              'INSERT {\n    name: "{{ nameInput.text }}",\n    gender: "{{ genderDropdown.selectedOptionValue }}",\n    email: "{{ emailInput.text }}"\n} INTO users\n\n// nameInput and genderDropdown are example widgets, replace them with your widget names. To understand more please\n// check out: https://docs.appsmith.com/core-concepts/capturing-data-write\n// Read more at https://www.arangodb.com/docs/stable/aql/',
            SELECT:
              'FOR user IN users\nFILTER user.role == "Admin"\nSORT user.id ASC\nLIMIT 10\nRETURN user\n\n// Use widget data in a query using {{ widgetName.property }}. To understand more, please check out:\n// https://docs.appsmith.com/core-concepts/capturing-data-write\n// Read more at https://www.arangodb.com/docs/stable/aql/',
            UPDATE:
              'UPDATE\n"{{ usersTable.selectedRow.id }}"\nWITH\n{\n    status: "APPROVED"\n}\nIN users\n\n// usersTable is an example table widget from where the id is being read. Replace it with your own Table widget or a\n// static value. To understand more please check out: https://docs.appsmith.com/core-concepts/capturing-data-write\n// Read more at https://www.arangodb.com/docs/stable/aql/',
            DELETE:
              'REMOVE "1" IN users\n\n// Use widget data in a query by replacing static values with {{ widgetName.property }}. To understand more please\n// check out https://docs.appsmith.com/core-concepts/capturing-data-write\n// Read more at https://www.arangodb.com/docs/stable/aql/',
          },
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b63",
          userPermissions: [],
          name: "JS Functions",
          type: "JS",
          packageName: "js-plugin",
          iconLocation: "https://assets.appsmith.com/js-yellow.svg",
          documentationLink:
            "https://docs.appsmith.com/v/v1.2.1/js-reference/using-js",
          responseType: "JSON",
          uiComponent: "JsEditorForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b64",
          userPermissions: [],
          name: "SMTP",
          type: "DB",
          packageName: "smtp-plugin",
          iconLocation: "https://assets.appsmith.com/smtp-icon.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/using-smtp",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "AutoForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236225e9a6424e4c04b74",
          userPermissions: [],
          name: "Authenticated GraphQL API",
          type: "API",
          packageName: "graphql-plugin",
          iconLocation:
            "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/graphql.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/graphql#create-queries",
          responseType: "JSON",
          uiComponent: "GraphQLEditorForm",
          datasourceComponent: "RestAPIDatasourceForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236225e9a6424e4c04b75",
          userPermissions: [],
          name: "Oracle",
          type: "DB",
          packageName: "oracle-plugin",
          iconLocation:
            "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/querying-oracle#create-queries",
          responseType: "TABLE",
          uiComponent: "DbEditorForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {
            SELECT:
              "SELECT* FROM <<your_table_name>> WHERE ROWNUM < 10;\n\n-- Please enter a valid table name and hit RUN\n",
            INSERT:
              "INSERT INTO users\n  (name, gender, email)\nVALUES\n  (\n    {{ nameInput.text }},\n    {{ genderDropdown.selectedOptionValue }},\n    {{ emailInput.text }}\n  )",
            UPDATE:
              "UPDATE users SET status = 'APPROVED' WHERE id = {{ usersTable.selectedRow.id }}",
            DELETE: "DELETE FROM users WHERE id = {{idInput.text}}",
          },
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236465e9a6424e4c04b77",
          userPermissions: [],
          name: "HubSpot",
          type: "REMOTE",
          packageName: "saas-plugin",
          pluginName: "hubspot-1.2-plugin",
          iconLocation: "https://assets.appsmith.com/integrations/hubspot.png",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/hubspot#create-queries",
          responseType: "JSON",
          version: "1.0",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "AutoForm",
          allowUserDatasources: true,
          isRemotePlugin: true,
          actionUiConfig: {
            editor: [
              {
                label: "Command",
                description: "Select the method to run",
                configProperty: "actionConfiguration.formData.command",
                controlType: "DROP_DOWN",
                options: [
                  {
                    index: 1,
                    label: "HubDB - get published tables",
                    value: "GET_PUBLISHED_TABLES",
                  },
                  {
                    index: 2,
                    label: "HubDB - create table",
                    value: "CREATE_TABLE",
                  },
                  {
                    index: 3,
                    label: "HubDB - get details of a published table",
                    value: "GET_DETAILS_PUBLISHED_TABLE",
                  },
                  {
                    index: 4,
                    label: "HubDB - archive table",
                    value: "ARCHIVE_TABLE",
                  },
                  {
                    index: 5,
                    label: "HubDB - update existing table",
                    value: "UPDATE_EXISTING_TABLE",
                  },
                  {
                    index: 6,
                    label: "HubDB - clone table",
                    value: "CLONE_TABLE",
                  },
                  {
                    index: 7,
                    label: "HubDB - export published version table",
                    value: "EXPORT_PUBLISHED_VERSION_TABLE",
                  },
                  {
                    index: 8,
                    label: "HubDB - unpublish table",
                    value: "UNPUBLISH_TABLE",
                  },
                  {
                    index: 9,
                    label: "HubDB - get table rows",
                    value: "GET_ROWS_TABLE",
                  },
                  {
                    index: 10,
                    label: "HubDB - add new table row",
                    value: "ADD_NEW_ROW_TABLE",
                  },
                  {
                    index: 11,
                    label: "HubDB - get table row",
                    value: "GET_TABLE_ROW",
                  },
                  {
                    index: 12,
                    label: "HubDB - update existing row",
                    value: "UPDATE_EXISTING_ROW",
                  },
                  {
                    index: 13,
                    label: "HubDB - replace existing row",
                    value: "REPLACE_EXISTING_ROW",
                  },
                  {
                    index: 14,
                    label: "HubDB - permanently delete row",
                    value: "PERMANENTLY_DELETE_A_ROW",
                  },
                  {
                    index: 15,
                    label: "HubDB - clone row",
                    value: "CLONE_ROW",
                  },
                  {
                    index: 16,
                    label: "HubDB - get set rows",
                    value: "GET_SET_ROWS",
                  },
                  {
                    index: 17,
                    label: "HubDB - permanently delete rows",
                    value: "PERMANENTLY_DELETE_ROWS",
                  },
                  {
                    index: 18,
                    label: "Domains - get current domains",
                    value: "GET_CURRENT_DOMAINS",
                  },
                  {
                    index: 19,
                    label: "Domains - get single domain",
                    value: "GET_SINGLE_DOMAINS",
                  },
                  {
                    index: 20,
                    label: "URL redirects - get current redirects",
                    value: "GET_CURRENT_REDIRECTS",
                  },
                  {
                    index: 21,
                    label: "URL redirects - create redirect",
                    value: "CREATE_A_REDIRECT",
                  },
                  {
                    index: 22,
                    label: "URL redirects - get details redirect",
                    value: "GET_DETAILS_FOR_A_REDIRECT",
                  },
                  {
                    index: 23,
                    label: "URL redirects - update redirect",
                    value: "UPDATE_A_REDIRECT",
                  },
                  {
                    index: 24,
                    label: "URL redirects - delete redirect",
                    value: "DELETE_A_REDIRECT",
                  },
                  {
                    index: 25,
                    label: "CRM - list objects",
                    value: "LIST_OBJECTS",
                  },
                  {
                    index: 26,
                    label: "CRM - create object",
                    value: "CREATE_OBJECT",
                  },
                  {
                    index: 27,
                    label: "CRM - read object",
                    value: "READ_OBJECT",
                  },
                  {
                    index: 28,
                    label: "CRM - update object",
                    value: "UPDATE_OBJECT",
                  },
                  {
                    index: 29,
                    label: "CRM - archive object",
                    value: "ARCHIVE_OBJECT",
                  },
                  {
                    index: 30,
                    label: "CRM - search object",
                    value: "SEARCH_OBJECT",
                  },
                  {
                    index: 31,
                    label: "CRM - GDPR delete",
                    value: "GDPR_DELETE",
                  },
                  {
                    index: 32,
                    label: "Files - import file",
                    value: "IMPORT_FILE",
                  },
                  {
                    index: 33,
                    label: "Files - delete file",
                    value: "DELETE_FILE",
                  },
                  {
                    index: 34,
                    label: "Files - get file",
                    value: "GET_FILE",
                  },
                  {
                    index: 35,
                    label: "Files - create folder",
                    value: "CREATE_FOLDER",
                  },
                  {
                    index: 36,
                    label: "Files - search file",
                    value: "SEARCH_FILE",
                  },
                  {
                    index: 38,
                    label: "Files - search folder",
                    value: "SEARCH_FOLDERS",
                  },
                  {
                    index: 39,
                    label: "Files - update folder properties",
                    value: "UPDATE_FOLDER_PROPERTIES",
                  },
                  {
                    index: 40,
                    label: "Files - check folder update status",
                    value: "CHECK_FOLDER_UPDATE_STATUS",
                  },
                  {
                    index: 41,
                    label: "Files - get folder",
                    value: "GET_FOLDER",
                  },
                  {
                    index: 42,
                    label: "Files - delete folder",
                    value: "DELETE_FOLDER",
                  },
                  {
                    index: 43,
                    label: "Settings - retrieve list of users",
                    value: "RETRIEVE_LIST_USERS",
                  },
                  {
                    index: 44,
                    label: "Settings - add user",
                    value: "ADD_USER",
                  },
                  {
                    index: 45,
                    label: "Settings - retrieve user",
                    value: "RETRIEVES_USER",
                  },
                  {
                    index: 46,
                    label: "Settings - modify user",
                    value: "MODIFY_USER",
                  },
                  {
                    index: 47,
                    label: "Settings - remove user",
                    value: "REMOVES_USER",
                  },
                  {
                    index: 48,
                    label: "Settings - retrieve roles account",
                    value: "RETRIEVES_ROLES_ACCOUNT",
                  },
                  {
                    index: 49,
                    label: "Settings - see details account's teams",
                    value: "SEE_DETAILS_ACCOUNT'S_TEAMS",
                  },
                ],
              },
              {
                identifier: "ARCHIVE_OBJECT",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "objectType",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "Object type",
                    configProperty: "actionConfiguration.formData.objectType",
                    isRequired: true,
                    requiresEncoding: true,
                    tooltipText:
                      "Valid object type for the CRM (contacts, companies, deals, tickets, etc.).",
                    subtitle: "Valid object type for the CRM.",
                    placeholderText: "contacts",
                  },
                  {
                    configProperty: "actionConfiguration.formData.objectId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "objectId",
                    label: "Object ID",
                    isRequired: true,
                    tooltipText:
                      "Identifier that was used when the object was created. If you do not remember it, you can use list objects to find the id.",
                    subtitle: "Identifier of the object. ",
                    placeholderText: "201",
                  },
                ],
                name: "Archive object",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'ARCHIVE_OBJECT'}}",
                },
              },
              {
                identifier: "UPDATE_EXISTING_TABLE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "archived",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Specifies whether to return archived tables. Defaults to false. ",
                    subtitle: "Whether to return only archived results.",
                    placeholderText: "false",
                    label: "Archived",
                    configProperty: "actionConfiguration.formData.archived",
                    initialValue: "false",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.inludeForeignIds",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "inludeForeignIds",
                    label: "Include foreign IDs",
                    placeholderText: "false",
                    subtitle:
                      "If true, populate foreign ID values in the result. ",
                    tooltipText:
                      "Set this to true  to populate foreign ID values in the result. Defaults to false.",
                    initialValue: "false",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "tableIdOrName",
                    label: "Table ID or name",
                    placeholderText: "test_table",
                    subtitle: "Table name or ID of the table to update. ",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    isRequired: true,
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.name",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "name",
                    isRequired: true,
                    label: "Name",
                    requiresEncoding: false,
                    subtitle: "Name of the resulting table.",
                    tooltipText:
                      "Name that will be used to identify the table.",
                    placeholderText: "test_table",
                  },
                  {
                    configProperty: "actionConfiguration.formData.label",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "label",
                    label: "Label",
                    placeholderText: "Test table",
                    requiresEncoding: false,
                    subtitle: "Label of the resulting table. ",
                    tooltipText: "Label to represent the table name.",
                    isRequired: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.useForPages",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "useForPages",
                    initialValue: "false",
                    label: "Use for pages",
                    placeholderText: "false",
                    subtitle:
                      "If true, the table can be used for creation of dynamic pages. ",
                    tooltipText:
                      "The table can be used for creation of dynamic pages. Default value: false",
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.columns",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "columns",
                    label: "Columns",
                    subtitle: "List of columns in the table.",
                    tooltipText:
                      "List of columns in the table. Refer Hubspot documentation to create the columns, all column fields are required (id, name, label, type, options). in options you can add multi-columns. type: array",
                    isRequired: true,
                    requiresEncoding: false,
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.allowPublicApiAccess",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "allowPublicApiAccess",
                    initialValue: "false",
                    label: "Allow public API access",
                    placeholderText: "false",
                    subtitle:
                      "If true, the table can be read by public without authorization.",
                    tooltipText:
                      "The table can be read by public without authorization. Default value: false",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.allowChildTables",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "allowChildTables",
                    initialValue: "false",
                    label: "Allow child tables",
                    placeholderText: "false",
                    subtitle: "If true, the child tables can be created. ",
                    tooltipText:
                      "Whether child tables can be created. Default value:false",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.enableChildTablePages",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "enableChildTablePages",
                    initialValue: "false",
                    label: "Enable child table pages",
                    placeholderText: "false",
                    subtitle:
                      "If true, is created a multi-level dynamic pages using child tables.",
                    tooltipText:
                      "Create multi-level dynamic pages using child tables. Default value: false.",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.foreignTableId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "foreignTableId",
                    initialValue: "null",
                    label: "Foreign table ID",
                    placeholderText: "5378084",
                    subtitle: "ID of another table. ",
                    tooltipText:
                      "ID of another table to which the column refers/points to. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.foreignColumnId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "foreignColumnId",
                    initialValue: "null",
                    label: "Foreign column ID",
                    placeholderText: "5378084",
                    subtitle: "ID of the column from another table.",
                    tooltipText:
                      "ID of the column from another table to which the column refers/points to. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.dynamicMetaTags",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "dynamicMetaTags",
                    initialValue: "{}",
                    label: "Dynamic meta tags",
                    placeholderText: "{}",
                    requiresEncoding: false,
                    subtitle: "Key value pairs. ",
                    tooltipText:
                      "The key value pairs of the metadata fields with the associated column ids. type: array",
                  },
                ],
                name: "Update Existing table",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'UPDATE_EXISTING_TABLE'}}",
                },
              },
              {
                identifier: "REMOVES_USER",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "idProperty",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "ID property",
                    configProperty: "actionConfiguration.formData.idProperty",
                    tooltipText:
                      "The name of a property with unique user values. Valid values are USER_ID(default) or EMAIL. ",
                    subtitle: "Name of a property with unique user values.",
                  },
                  {
                    identifier: "userId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "User ID",
                    configProperty: "actionConfiguration.formData.userId",
                    isRequired: true,
                    tooltipText: "Identifier of user to delete. ",
                    subtitle: "Identifier of user to delete. ",
                    placeholderText: "13358977",
                  },
                ],
                name: "Removes User",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'REMOVES_USER'}}",
                },
              },
              {
                identifier: "SEARCH_OBJECT",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "objectType",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    configProperty: "actionConfiguration.formData.objectType",
                    label: "Object type",
                    placeholderText: "contacts",
                    subtitle: "Valid object type for the CRM. ",
                    tooltipText:
                      "Valid object type for the CRM (contacts, companies, deals, tickets, etc.) ",
                    isRequired: true,
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.value",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "value",
                    isRequired: true,
                    label: "Value",
                    placeholderText: "Bryan",
                    subtitle: "Filter the matching property values",
                    tooltipText:
                      "Use filters in the request body to limit the results to only records with matching property values. ",
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.propertyName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "propertyName",
                    isRequired: true,
                    label: "Property name",
                    placeholderText: "firstname",
                    requiresEncoding: false,
                    subtitle: "Filter the matching property values",
                    tooltipText:
                      "Use filters in the request body to limit the results to only records with matching property values. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.operator",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "operator",
                    isRequired: true,
                    label: "Operator",
                    placeholderText: "EQ",
                    requiresEncoding: true,
                    subtitle: "Logical operator.",
                    tooltipText:
                      "Logical operator. EQ (Equal to), LT (Less than), GT (Greater than),BETWEEN (Within the specified range), IN (Included within the specified list), CONTAINS_TOKEN. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.sorts",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "sorts",
                    isRequired: true,
                    label: "Sorts",
                    placeholderText:
                      ' [ {     "propertyName": "createdate",     "direction": "DESCENDING"   }]',
                    requiresEncoding: false,
                    subtitle: "Array with different sorting rules.",
                    tooltipText:
                      "Use a sorting rule in the request body to list results in ascending or descending order. Only one sorting rule can be applied to any search.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.query",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "query",
                    label: "Query",
                    requiresEncoding: false,
                    subtitle:
                      "Letter or word to find for all objects with a default text property that contain this value",
                    tooltipText:
                      "Searches for all objects with a default text property value containing in the string. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.properties",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "properties",
                    isRequired: true,
                    label: "Properties",
                    placeholderText: "b",
                    requiresEncoding: false,
                    subtitle:
                      "Comma separated list of the properties to be returned.",
                    tooltipText:
                      "A comma separated list of the properties to be returned in the  response. If any of the specified properties are not present on the requested object(s), they will be ignored. type: array",
                  },
                  {
                    configProperty: "actionConfiguration.formData.limit",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "limit",
                    initialValue: "10",
                    isRequired: true,
                    label: "Limit",
                    placeholderText: "10",
                    subtitle:
                      "Maximum number of results objects to display per page. ",
                    tooltipText:
                      "The maximum number of results to display per page.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.after",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "after",
                    initialValue: "0",
                    isRequired: true,
                    label: "After",
                    placeholderText: "1",
                    requiresEncoding: false,
                    subtitle:
                      "To obtain the token look for the next page token or after field, in the response.",
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                  },
                ],
                name: "Search object",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'SEARCH_OBJECT'}}",
                },
              },
              {
                identifier: "GET_FOLDER",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "properties",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Properties to set on returned folder. type: array",
                    subtitle:
                      "Comma separated list of the properties to be returned in the response.",
                    label: "Properties",
                    configProperty: "actionConfiguration.formData.properties",
                  },
                  {
                    identifier: "folderId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    requiresEncoding: true,
                    tooltipText: "Identifier of desired folder. ",
                    subtitle: "Folder ID. ",
                    label: "Folder ID",
                    placeholderText: "74302751362",
                    configProperty: "actionConfiguration.formData.folderId",
                  },
                ],
                name: "Get folder",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_FOLDER'}}",
                },
              },
              {
                identifier: "CREATE_OBJECT",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "objectType",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    configProperty: "actionConfiguration.formData.objectType",
                    label: "Object type",
                    placeholderText: "contacts",
                    subtitle: "Valid object type for the CRM.",
                    tooltipText:
                      "Valid object type for the CRM (contacts, companies, deals, tickets, etc.)",
                    isRequired: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.properties",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "properties",
                    isRequired: true,
                    label: "Properties",
                    placeholderText:
                      '{ "company": "Elv",    "email": "test@elv.net",    "firstname": "Test",         "lastname": "Cooper", "phone": "(877)112-05252", "website": "biglytics.net"}',
                    requiresEncoding: false,
                    subtitle: "Properties object for the specific objectType. ",
                    tooltipText:
                      "A properties object for the specific objecType.",
                  },
                ],
                name: "Create object",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CREATE_OBJECT'}}",
                },
              },
              {
                identifier: "SEE_DETAILS_ACCOUNT'S_TEAMS",
                controlType: "SECTION",
                children: [],
                name: "See Details account's Teams",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'SEE_DETAILS_ACCOUNT'S_TEAMS'}}",
                },
              },
              {
                identifier: "READ_OBJECT",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "properties",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "Properties",
                    configProperty: "actionConfiguration.formData.properties",
                    requiresEncoding: true,
                    tooltipText:
                      "A comma separated list of the properties to be returned in the  response. If any of the specified properties are not present on the  requested object(s), they will be ignored. type: String[]",
                    subtitle:
                      "Comma separated list of the properties to be returned in the response.",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.propertiesWithHistory",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "propertiesWithHistory",
                    label: "Properties with history",
                    requiresEncoding: true,
                    tooltipText:
                      "A comma separated list of the properties to be returned along with  their history of previous values. If any of the specified properties are  not present on the requested object(s), they will be ignored. Usage of  this parameter will reduce the maximum number of objects that can be  read by a single request. type: String[]",
                    subtitle:
                      "Comma separated list of the properties to be returned along with  their history of previous values.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.associations",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "associations",
                    label: "Associations",
                    requiresEncoding: true,
                    tooltipText:
                      "A comma separated list of object types to retrieve associated IDs  for. If any of the specified associations do not exist, they will be  ignored. type: String[]",
                    subtitle:
                      "Comma separated list of object types to retrieve associated IDs for.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.archived",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "archived",
                    label: "Archived",
                    requiresEncoding: false,
                    tooltipText:
                      "Specifies whether to return archived objects. ",
                    subtitle: "If true, return only archived results.",
                    placeholderText: "false",
                  },
                  {
                    configProperty: "actionConfiguration.formData.objectType",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "objectType",
                    isRequired: true,
                    label: "Object type",
                    tooltipText:
                      "Valid object type for the CRM (contacts, companies, deals, tickets, etc.)",
                    subtitle: "Valid object type for the CRM.",
                    placeholderText: "contacts",
                  },
                  {
                    configProperty: "actionConfiguration.formData.objectId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "objectId",
                    isRequired: true,
                    label: "Object ID",
                    tooltipText:
                      "Identifier that was used when the object was created. If you do not remember it, you can use list objects to find the id.",
                    subtitle: "ID of the object. ",
                    placeholderText: "201",
                  },
                ],
                name: "Read object",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'READ_OBJECT'}}",
                },
              },
              {
                identifier: "GET_TABLE_ROW",
                controlType: "SECTION",
                children: [
                  {
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "tableIdOrName",
                    label: "Table ID or name",
                    subtitle: "ID or name of the table. ",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    isRequired: true,
                    requiresEncoding: true,
                    placeholderText: "test_table",
                  },
                  {
                    configProperty: "actionConfiguration.formData.rowId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "rowId",
                    label: "Row ID",
                    subtitle: "Row ID.",
                    tooltipText: "The ID of the row.",
                    isRequired: true,
                    placeholderText: "5378084",
                  },
                ],
                name: "Get table Row",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_TABLE_ROW'}}",
                },
              },
              {
                identifier: "ADD_USER",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "email",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "Email",
                    configProperty: "actionConfiguration.formData.email",
                    placeholderText: "newUser@email.com",
                    isRequired: true,
                    tooltipText: "The created user's email.",
                    subtitle: "User email. ",
                  },
                  {
                    identifier: "roleId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "Role ID",
                    configProperty: "actionConfiguration.formData.roleId",
                    initialValue: "null",
                    placeholderText: "310427",
                    tooltipText: "The user's role.",
                    subtitle: "User role ID.  ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.primaryTeamId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "primaryTeamId",
                    initialValue: "null",
                    label: "Primary team ID",
                    placeholderText: "7824745",
                    tooltipText: "The user's primary team.",
                    subtitle: "User primary team ID. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.secondaryTeamIds",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "secondaryTeamIds",
                    initialValue: "[]",
                    label: "Secondary team Ids",
                    placeholderText: " [”7885423”,”78525623”]",
                    tooltipText: "The user's additional teams.  type: array.",
                    subtitle: "User additional teams IDs. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.sendWelcomeEmail",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "sendWelcomeEmail",
                    initialValue: "false",
                    label: "Send welcome email",
                    placeholderText: "false",
                    isRequired: true,
                    tooltipText: "Whether to send a welcome email  ",
                    subtitle: "If true, send a welcome email.",
                  },
                ],
                name: "Add User",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'ADD_USER'}}",
                },
              },
              {
                identifier: "IMPORT_FILE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "access",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    requiresEncoding: true,
                    tooltipText:
                      "PUBLIC_INDEXABLE:  File is publicly accessible by anyone who has the URL. Search engines  can index the file. PUBLIC_NOT_INDEXABLE: File is publicly accessible by anyone who has the URL. Search engines can't index the file. PRIVATE: File is NOT publicly accessible. Requires a signed URL to see content. Search engines can't  index the file. ",
                    subtitle: "Type of access to the file. ",
                    label: "Access",
                    placeholderText: "PUBLIC_INDEXABLE",
                    configProperty: "actionConfiguration.formData.access",
                  },
                  {
                    identifier: "ttl",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Time to live. If specified the file will be deleted after the given time frame. ",
                    subtitle:
                      "The file will be deleted after the given time frame.",
                    placeholderText: "5",
                    label: "TTL",
                    configProperty: "actionConfiguration.formData.ttl",
                  },
                  {
                    configProperty: "actionConfiguration.formData.name",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "name",
                    label: "Name",
                    placeholderText: "test-file",
                    requiresEncoding: true,
                    subtitle:
                      "Name of the resulting file in the file manager. ",
                    tooltipText:
                      "Name to give the resulting file in the file manager. ",
                  },
                  {
                    identifier: "url",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    requiresEncoding: false,
                    tooltipText: "URL to download the new file from. ",
                    subtitle: "URL to download the new file from.",
                    label: "URL",
                    configProperty: "actionConfiguration.formData.url",
                  },
                  {
                    configProperty: "actionConfiguration.formData.folderPath",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "folderPath",
                    isRequired: true,
                    label: "Folder path",
                    placeholderText: "/myNewFolder",
                    requiresEncoding: true,
                    subtitle: "Destination folder path for the uploaded file. ",
                    tooltipText:
                      "One of folderPath or folderId is required. Destination folder path for the uploaded file. If the folder path does not exist, there will be an attempt to create the folder path. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.duplicateValidationStrategy",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "duplicateValidationStrategy",
                    isRequired: true,
                    label: "Duplicate validation strategy",
                    placeholderText: "NONE",
                    requiresEncoding: true,
                    subtitle: "Type of strategy for duplicate validation.",
                    tooltipText:
                      "NONE: Do not run any duplicate validation. REJECT: Reject the upload if a duplicate is found. RETURN_EXISTING: If a duplicate file is found, do not upload a new file and return the found duplicate instead. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.duplicateValidationScope",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "duplicateValidationScope",
                    isRequired: true,
                    label: "Duplicate validation scope",
                    placeholderText: "EXACT_FOLDER",
                    requiresEncoding: true,
                    subtitle:
                      "Look for a duplicate file in the entire account or a duplicate file in the provided folder. ",
                    tooltipText:
                      "ENTIRE_PORTAL: Look for a duplicate file in the entire account. EXACT_FOLDER: Look for a duplicate file in the provided folder. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.overwrite",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "overwrite",
                    initialValue: "false",
                    isRequired: true,
                    label: "Overwrite",
                    placeholderText: "false",
                    subtitle:
                      "If true, overwrites existing files if a file with the same name exists in the given folder. ",
                    tooltipText:
                      "If true, it will overwrite existing files if a file with the same name exists in the given folder.",
                  },
                ],
                name: "Import File",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'IMPORT_FILE'}}",
                },
              },
              {
                identifier: "RETRIEVES_ROLES_ACCOUNT",
                controlType: "SECTION",
                children: [],
                name: "Retrieves Roles account",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'RETRIEVES_ROLES_ACCOUNT'}}",
                },
              },
              {
                identifier: "GET_CURRENT_REDIRECTS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "createdAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "Created at",
                    configProperty: "actionConfiguration.formData.createdAt",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    tooltipText:
                      "Only return redirects created on exactly this date. ",
                    subtitle:
                      "Return redirects created on exactly this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
                  },
                  {
                    identifier: "createdAfter",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "Created after",
                    configProperty: "actionConfiguration.formData.createdAfter",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    tooltipText:
                      "Only return redirects created after this date.  ",
                    subtitle:
                      "Return domains created after this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.createdBefore",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "createdBefore",
                    label: "Created before",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    tooltipText:
                      "Only return redirects created before this date.  ",
                    subtitle:
                      "Return domains created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAt",
                    label: "Updated at",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    tooltipText:
                      "Only return redirects last updated on exactly this date.  ",
                    subtitle:
                      "Return domains updated at this date. Format YYYY-MM-DDThh:mm:ss.sZ.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAfter",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAfter",
                    label: "Updated after",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    tooltipText:
                      "Only return redirects last updated after this date.  ",
                    subtitle:
                      "Return domains updated after this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.updatedBefore",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedBefore",
                    label: "Updated before",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    tooltipText:
                      "Only return redirects last updated before this date. ",
                    subtitle:
                      "Return domains updated before this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.sort",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "sort",
                    label: "Sort",
                    requiresEncoding: true,
                    tooltipText:
                      "Column names to sort the results by. type: array.",
                    subtitle: "Column names to sort the results by.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.properties",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "properties",
                    label: "Properties",
                    requiresEncoding: true,
                    tooltipText:
                      "A comma separated list of the properties to be returned in the response. If any of the specified properties are not present on the requested object(s), they will be ignored. type: array.",
                    subtitle:
                      "Comma separated list of the properties to be returned in the response.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.after",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "after",
                    label: "Next page token",
                    requiresEncoding: true,
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                    subtitle:
                      "To obtain the token look for the next page token or after field, in the response.",
                    placeholderText: "MQ%3D%3D",
                  },
                  {
                    configProperty: "actionConfiguration.formData.before",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "before",
                    label: "Before page token",
                    requiresEncoding: true,
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                    subtitle:
                      "To obtain the token look for the next page token or  before field, in the response.",
                    placeholderText: "MQ%3D%3D",
                  },
                  {
                    configProperty: "actionConfiguration.formData.limit",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "limit",
                    initialValue: "1000",
                    label: "Limit",
                    placeholderText: "1000",
                    tooltipText:
                      "Maximum number of results to return. Default is 1000.",
                    subtitle:
                      "The maximum number of published tables to return. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.archived",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "archived",
                    initialValue: "false",
                    label: "Archived",
                    placeholderText: "false",
                    tooltipText:
                      "Specifies whether to return archived tables. Defaults to false. ",
                    subtitle: "Whether to return only archived results.",
                  },
                ],
                name: "Get current redirects",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_CURRENT_REDIRECTS'}}",
                },
              },
              {
                identifier: "GET_DETAILS_FOR_A_REDIRECT",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "urlRedirectId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "URL redirect ID",
                    configProperty:
                      "actionConfiguration.formData.urlRedirectId",
                    isRequired: true,
                    requiresEncoding: true,
                    tooltipText:
                      "Identifier that was used when the URL redirect was created. If you do not remember it, you can use get current redirects to find the id.",
                    subtitle: "Write the ID of the target redirect. ",
                    placeholderText: "71783843089",
                  },
                ],
                name: "Get Details for a redirect",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_DETAILS_FOR_A_REDIRECT'}}",
                },
              },
              {
                identifier: "CREATE_FOLDER",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "name",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "Name",
                    configProperty: "actionConfiguration.formData.name",
                    tooltipText: "Desired name for the folder.",
                    subtitle: "Folder name.  ",
                    requiresEncoding: true,
                    isRequired: true,
                    placeholderText: "myNewFolder",
                  },
                  {
                    configProperty: "actionConfiguration.formData.parentPath",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "parentPath",
                    label: "Parent path",
                    subtitle:
                      "Path of the parent of the created folder. If not specified the folder will be created at the root level. ",
                    tooltipText:
                      "Path of the parent of the created folder. If not specified the folder will be created at the root level. parentFolderPath and parentFolderId cannot be set at the same time. ",
                    requiresEncoding: true,
                    placeholderText: "/myNewFolder1",
                  },
                ],
                name: "Create folder",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CREATE_FOLDER'}}",
                },
              },
              {
                identifier: "UPDATE_A_REDIRECT",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "urlRedirectId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "The ID of the target redirect. ",
                    subtitle: "The ID of the target redirect.",
                    placeholderText: "71783843089",
                    label: "URL redirect ID",
                    configProperty:
                      "actionConfiguration.formData.urlRedirectId",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                  {
                    identifier: "id",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the URL redirect was created. If you do not remember it, you can use get current redirects to find the id.",
                    subtitle: "Unique ID of this URL redirect.",
                    placeholderText: "71783843089",
                    label: "ID",
                    configProperty: "actionConfiguration.formData.id",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                  {
                    identifier: "routePrefix",
                    isRequired: true,
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The target incoming URL, path, or pattern to match for redirection. ",
                    subtitle: "Target incoming URL",
                    label: "Route prefix",
                    configProperty: "actionConfiguration.formData.routePrefix",
                    placeholderText: "/the-original-source",
                  },
                  {
                    configProperty: "actionConfiguration.formData.destination",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "destination",
                    isRequired: true,
                    label: "Destination",
                    placeholderText:
                      "http://6255.sites.hubspot.com/destination-url",
                    requiresEncoding: true,
                    subtitle: "Destination URL",
                    tooltipText:
                      "The destination URL, where the target URL should be redirected if it matches the routePrefix.",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.redirectStyle",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "redirectStyle",
                    isRequired: true,
                    label: "Redirect style",
                    placeholderText: "302",
                    subtitle: "Type of redirect to create. ",
                    tooltipText:
                      "The type of redirect to create. Options include: 301 (permanent), 302 (temporary), or 305 (proxy). ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.isOnlyAfterNotFound",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "isOnlyAfterNotFound",
                    initialValue: "false",
                    label: " Is only after not found",
                    placeholderText: "false",
                    subtitle: "If true the URL redirect mapping should apply. ",
                    tooltipText:
                      "Whether the URL redirect mapping should apply only if a live page on the URL isn't found. If False, the URL redirect mapping will take precedence over any existing page. ",
                    isRequired: true,
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.isMatchFullUrl",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "isMatchFullUrl",
                    isRequired: true,
                    label: "Is match full URL",
                    subtitle:
                      "If  true the routePrefix  should match on the entire URL. ",
                    tooltipText:
                      "Whether the routePrefix  should match on the entire URL, including the domain. ",
                    initialValue: "false",
                    placeholderText: "false",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.isMatchQueryString",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "isMatchQueryString",
                    initialValue: "false",
                    label: "Is match query string",
                    placeholderText: "false",
                    subtitle:
                      "If true the routePrefix should match the entire URL route.",
                    tooltipText:
                      "Whether the routePrefix  should match on the entire URL path, including the query string. ",
                    isRequired: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.isPattern",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "isPattern",
                    initialValue: "false",
                    label: "Is pattern",
                    placeholderText: "false",
                    subtitle:
                      "If true the routePrefix  should match based on pattern. ",
                    tooltipText:
                      "Whether the routePrefix  should match based on pattern. ",
                    isRequired: true,
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.isTrailingSlashOptional",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "isTrailingSlashOptional",
                    initialValue: "false",
                    label: "Is trailing slash optional",
                    placeholderText: "false",
                    subtitle: "If true a trailing slash will be ignored. ",
                    tooltipText: "Whether a trailing slash will be ignored. ",
                    isRequired: true,
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.isProtocolAgnostic",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "isProtocolAgnostic",
                    initialValue: "false",
                    label: "Is protocol agnostic",
                    placeholderText: "false",
                    subtitle:
                      "if true, the routePrefix  should match both HTTP and HTTPS protocols",
                    tooltipText:
                      "Whether the routePrefix  should match both HTTP and HTTPS protocols. ",
                    isRequired: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.precedence",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "precedence",
                    label: "Precedence",
                    placeholderText: "1000000001",
                    subtitle: "Prioritize URL redirection.",
                    tooltipText:
                      "Used to prioritize URL redirection. If a given URL matches more than one redirect, the one with the lower precedence will be used.",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.createdAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "createdAt",
                    label: "Created at",
                    placeholderText: "2022-08-25T23:23:49.566Z",
                    subtitle: "URL redirect was first created.",
                    tooltipText:
                      "When the url redirect was first created, in milliseconds since the epoch. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAt",
                    label: "Updated at",
                    placeholderText: "2022-08-26T03:20:04.675Z",
                    subtitle: "URL redirect was last updated.",
                    tooltipText:
                      "When the url redirect was last updated, in milliseconds since the epoch. ",
                  },
                ],
                name: "Update a redirect",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'UPDATE_A_REDIRECT'}}",
                },
              },
              {
                identifier: "GET_FILE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "fileId",
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the file was created. ",
                    subtitle: "ID of the desired file. ",
                    label: "File ID",
                    configProperty: "actionConfiguration.formData.fileId",
                    isRequired: true,
                    placeholderText: "76030562986",
                  },
                ],
                name: "Get File",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_FILE'}}",
                },
              },
              {
                identifier: "ADD_NEW_ROW_TABLE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table ID or name. ",
                    placeholderText: "test_table",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    isRequired: true,
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.path",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "path",
                    label: "Path",
                    placeholderText: "test_path",
                    subtitle: "The value for hs_path column.",
                    tooltipText:
                      "Value for hs_path  column, which will be used as slug in the dynamic pages.",
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.name",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "name",
                    label: "Name",
                    placeholderText: "text_title",
                    subtitle: "Value for hs_name column.",
                    tooltipText:
                      "Value for hs_name  column, which will be used as title in the dynamic pages. ",
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.childTableId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "childTableId",
                    label: "Child table ID",
                    subtitle: "Value for the column child table id.",
                    tooltipText: "Value for the column child table id.",
                    placeholderText: "5378084",
                    initialValue: "null",
                  },
                  {
                    configProperty: "actionConfiguration.formData.values",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "values",
                    isRequired: true,
                    label: "Values",
                    placeholderText:
                      '{     "text_column": "sample text value",     "multiselect": [       {         "id": "1",         "name": "Option 1",         "type": "option",         "order": 0       },       {         "id": "2",         "name": "Option 2",         "type": "option",         "order": 1       }     ]   }',
                    requiresEncoding: false,
                    subtitle: "Key value pairs. ",
                    tooltipText:
                      "List of key value pairs with the column name and column value. type: array.",
                  },
                ],
                name: "Add New Row table",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'ADD_NEW_ROW_TABLE'}}",
                },
              },
              {
                identifier: "GET_ROWS_TABLE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "sort",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Column names to sort the results by. type: array.",
                    subtitle:
                      "Fields to use for sorting results. array with fields to use for sorting results.",
                    label: "Sort",
                    configProperty: "actionConfiguration.formData.sort",
                  },
                  {
                    identifier: "after",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                    subtitle:
                      "To obtain the token look for the next page token or after field, in the response.",
                    label: "Next page token",
                    placeholderText: "MTA%3D",
                    configProperty: "actionConfiguration.formData.after",
                  },
                  {
                    identifier: "limit",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    initialValue: "1000",
                    tooltipText:
                      "Maximum number of results to return. Default is 1000.",
                    subtitle:
                      "The maximum number of published tables to return. ",
                    label: "Limit",
                    placeholderText: "1000",
                    configProperty: "actionConfiguration.formData.limit",
                  },
                  {
                    identifier: "properties",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Specify the column names to get results containing only the required columns instead of all column details. type: array.",
                    subtitle: "Array with the column names.",
                    label: "Properties",
                    configProperty: "actionConfiguration.formData.properties",
                  },
                  {
                    identifier: "tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table ID or name.",
                    label: "Table ID or name",
                    placeholderText: "test_table",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                ],
                name: "Get rows table",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_ROWS_TABLE'}}",
                },
              },
              {
                identifier: "GDPR_DELETE",
                controlType: "SECTION",
                children: [
                  {
                    configProperty: "actionConfiguration.formData.objectType",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "objectType",
                    isRequired: true,
                    label: "Object type",
                    subtitle: "Valid object type for the CRM.  ",
                    tooltipText:
                      "Valid object type for the CRM (contacts, companies, deals, tickets, etc.).",
                    placeholderText: "contacts",
                  },
                  {
                    configProperty: "actionConfiguration.formData.objectId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "objectId",
                    isRequired: true,
                    label: "Object ID",
                    placeholderText: "201",
                    subtitle: "Identifier of the object. ",
                    tooltipText:
                      "Identifier that was used when the object was created. If you do not remember it, you can use list objects to find the id.",
                  },
                ],
                name: "GDPR Delete",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GDPR_DELETE'}}",
                },
              },
              {
                identifier: "CLONE_ROW",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "tableIdOrName",
                    isRequired: true,
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table ID or name.",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    placeholderText: "test_table",
                  },
                  {
                    identifier: "rowId",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "The ID of the row.",
                    subtitle: "Row ID.",
                    label: "Row ID",
                    configProperty: "actionConfiguration.formData.rowId",
                    placeholderText: "5378084",
                  },
                ],
                name: "Clone Row",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CLONE_ROW'}}",
                },
              },
              {
                identifier: "CHECK_FOLDER_UPDATE_STATUS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "taskId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    requiresEncoding: true,
                    tooltipText: "Task ID of folder update. ",
                    subtitle:
                      "ID given by the response when updating a folder. ",
                    label: "Task ID",
                    placeholderText:
                      "AUhEIQ.AAAAEUzKAoI.V3DwstkzRO-PxOjIVjrW5Q",
                    configProperty: "actionConfiguration.formData.taskId",
                  },
                ],
                name: "Check folder Update Status",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CHECK_FOLDER_UPDATE_STATUS'}}",
                },
              },
              {
                identifier: "UNPUBLISH_TABLE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "includeForeignIds",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Set this to true  to populate foreign ID values in the response.",
                    subtitle:
                      "If true, populate foreign ID values in the response.",
                    label: "Include foreign IDs",
                    placeholderText: "false",
                    configProperty:
                      "actionConfiguration.formData.includeForeignIds",
                  },
                  {
                    identifier: "tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table ID or name to unpublish.",
                    label: "Table ID or name",
                    placeholderText: "test_table.",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    isRequired: true,
                  },
                ],
                name: "Unpublish table",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'UNPUBLISH_TABLE'}}",
                },
              },
              {
                identifier: "GET_CURRENT_DOMAINS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "createdAt",
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "Only return domains created at this date. ",
                    subtitle:
                      "Return domains created at this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                    label: "Created at",
                    configProperty: "actionConfiguration.formData.createdAt",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                  },
                  {
                    identifier: "createdAfter",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Only return domains created after this date. ",
                    subtitle:
                      "Return domains created after this date. Format: YYYY-MM-DDThh:mm:ss.sZ. ",
                    label: "Created after",
                    configProperty: "actionConfiguration.formData.createdAfter",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.createdBefore",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "createdBefore",
                    label: "Created before",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                    tooltipText:
                      "Only return domains created before this date. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAt",
                    label: "Updated at",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains updated at this date. Format YYYY-MM-DDThh:mm:ss.sZ.",
                    tooltipText: "Only return domains updated at this date. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAfter",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAfter",
                    label: "Updated after",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains updated after this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                    tooltipText:
                      "Only return domains updated after this date. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.updatedBefore",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedBefore",
                    label: "Updated before",
                    placeholderText: "2022-02-24T23:18:38.806Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains updated before this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                    tooltipText:
                      "Only return domains updated before this date. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.sort",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "sort",
                    label: "Sort",
                    requiresEncoding: true,
                    subtitle: "Column names to sort the results by.",
                    tooltipText:
                      "Specifies the column names to sort the results by. type: array.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.properties",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "properties",
                    label: "Properties",
                    requiresEncoding: true,
                    subtitle:
                      "Comma separated list of the properties to be returned in the response.",
                    tooltipText:
                      "A comma separated list of the properties to be returned in the response. If any of the specified properties are not present on the requested object(s), they will be ignore. type: array.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.after",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "after",
                    label: "Next page token",
                    placeholderText: "MQ%3D%3D",
                    requiresEncoding: true,
                    subtitle:
                      "To obtain the token look for the next page token or after field, in the response.",
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.before",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "before",
                    label: "Before page token",
                    placeholderText: "MQ%3D%3D.",
                    requiresEncoding: true,
                    subtitle:
                      "To obtain the token look for the next page token or before field, in the response.",
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.limit",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "limit",
                    initialValue: "1000",
                    isRequired: false,
                    label: "Limit",
                    placeholderText: "1000",
                    requiresEncoding: false,
                    subtitle:
                      "The maximum number of published tables to return. ",
                    tooltipText:
                      "Maximum number of results to return. Default is 1000.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.archived",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "archived",
                    initialValue: "false",
                    label: "Archived",
                    placeholderText: "false",
                    subtitle: "Whether to return only archived results.",
                    tooltipText:
                      "Specifies whether to return archived tables. Defaults to false. ",
                  },
                ],
                name: "Get current Domains",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_CURRENT_DOMAINS'}}",
                },
              },
              {
                identifier: "CREATE_TABLE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "name",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Name that will be used to identify the table when it is created.",
                    subtitle: "Name of the table.",
                    placeholderText: "test_table",
                    label: "Name",
                    configProperty: "actionConfiguration.formData.name",
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.label",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "label",
                    isRequired: true,
                    label: "Label",
                    placeholderText: "Test table",
                    requiresEncoding: false,
                    subtitle: "Label of the resulting table.",
                    tooltipText:
                      "Label to represent the table name when it is created.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.useForPages",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "useForPages",
                    initialValue: "false",
                    label: "Use for pages",
                    placeholderText: "false",
                    subtitle:
                      "If true, the table can be used to create dynamic pages.",
                    tooltipText:
                      "Whether the table can be used for creation of dynamic pages. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.columns",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "columns",
                    isRequired: true,
                    label: "Columns",
                    requiresEncoding: false,
                    subtitle: "List of columns in the table.",
                    tooltipText:
                      "List of columns in the table. Refer Hubspot documentation to create the columns, all column fields are required (id, name, label, type, options). in options you can add multi-columns. type: array",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.allowPublicApiAccess",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "allowPublicApiAccess",
                    initialValue: "false",
                    label: "Allow public API access",
                    placeholderText: "false",
                    requiresEncoding: false,
                    subtitle:
                      "If true, the table can be read by public without authorization.",
                    tooltipText:
                      "Whether the table can be read by public without authorization. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.allowChildTables",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "allowChildTables",
                    initialValue: "false",
                    label: "Allow child tables",
                    placeholderText: "false",
                    subtitle: "If true, child tables can be created.",
                    tooltipText: "Whether child tables can be created.",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.enableChildTablePages",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "enableChildTablePages",
                    initialValue: "false",
                    label: "Enable child table pages",
                    placeholderText: "false",
                    subtitle:
                      "If true, create multi-level dynamic pages using child tables. ",
                    tooltipText:
                      "Create multi-level dynamic pages using child tables. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.foreignTableId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "foreignTableId",
                    initialValue: "null",
                    label: "Foreign table ID",
                    placeholderText: "5378084",
                    subtitle:
                      "ID of another table to which the column refers/points to.",
                    tooltipText:
                      "ID of another table to which the column refers/points to. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.foreignColumnId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "foreignColumnId",
                    initialValue: "null",
                    label: "Foreign column ID",
                    placeholderText: "5378084",
                    subtitle: "Column ID from another table. ",
                    tooltipText:
                      "ID of a column from another table to which the column refers/points to. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.dynamicMetaTags",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "dynamicMetaTags",
                    initialValue: "{}",
                    label: "Dynamic meta tags",
                    placeholderText: "{}",
                    requiresEncoding: false,
                    subtitle: "Key value pairs. ",
                    tooltipText:
                      "The key value pairs of the metadata fields with the associated column ids. type: array.",
                  },
                ],
                name: "Create table",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CREATE_TABLE'}}",
                },
              },
              {
                identifier: "GET_DETAILS_PUBLISHED_TABLE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "archived",
                    requiresEncoding: false,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Specifies whether to return archived tables. Defaults to false. ",
                    subtitle: "If true, return archived results.",
                    placeholderText: "false",
                    label: "Archived",
                    initialValue: "false",
                    configProperty: "actionConfiguration.formData.archived",
                  },
                  {
                    identifier: "includeForeignIds",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Set this to true to populate foreign ID values in the result. ",
                    subtitle:
                      "If true, populate foreign ID values in the result. ",
                    placeholderText: "false",
                    label: "Include foreign IDs",
                    initialValue: "false",
                    configProperty:
                      "actionConfiguration.formData.includeForeignIds",
                  },
                  {
                    identifier: "tableIdOrName",
                    isRequired: true,
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table name or ID to return  details.",
                    placeholderText: "test_table",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                  },
                ],
                name: "Get Details published table",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_DETAILS_PUBLISHED_TABLE'}}",
                },
              },
              {
                identifier: "SEARCH_FILE",
                controlType: "SECTION",
                children: [
                  {
                    configProperty: "actionConfiguration.formData.properties",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "properties",
                    label: "Properties",
                    subtitle: "Desired file properties in the return object.",
                    tooltipText:
                      "Desired file properties in the return object. type: array",
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.after",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "after",
                    label: "Next page token",
                    placeholderText: " AAAAAQ",
                    subtitle:
                      "To obtain the token look for the next page token or after field, in the response.",
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.before",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "before",
                    label: "Before page token",
                    placeholderText: " AAAAAQ",
                    requiresEncoding: true,
                    subtitle:
                      "To obtain the token look for the next page token or before field, in the response.",
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.limit",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "limit",
                    label: "Limit",
                    subtitle: "The maximum number of result per page. ",
                    tooltipText:
                      "Maximum number of results to return. Default is 100.",
                    initialValue: "100",
                    placeholderText: "10",
                  },
                  {
                    configProperty: "actionConfiguration.formData.sort",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "sort",
                    label: "Sort",
                    requiresEncoding: true,
                    subtitle: "Columns names to sort the result by.",
                    tooltipText: "Sort files by a given field. type: array",
                  },
                  {
                    configProperty: "actionConfiguration.formData.id",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "id",
                    label: "ID",
                    subtitle: "Search files by given ID. ",
                    tooltipText: "Identifier of the file",
                    placeholderText: "74498869791",
                  },
                  {
                    configProperty: "actionConfiguration.formData.createdAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "createdAt",
                    label: "Created at",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return files created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    tooltipText: "Search files by time of creation.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.createdAtLte",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "createdAtLte",
                    label: "Created at Lte",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    subtitle:
                      "Return files created before this date in Lte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    tooltipText:
                      "Search files by time of creation in Lte format.",
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.createdAtGte",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "createdAtGte",
                    label: "Created at Gte",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return files created before this date in Gte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    tooltipText:
                      "Search files by time of creation in Gte format. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAt",
                    label: "Updated at",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return files updated at this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    tooltipText: "Search files by time of latest updated. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAtLte",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAtLte",
                    label: "Updated at Lte",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return files created before this date in Lte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    tooltipText:
                      "Search files by time of latest updated in Lte.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAtGte",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAtGte",
                    label: "Updated at Gte",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return files updated at this date in Gte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    tooltipText:
                      "Search files by time of latest updated in Gte. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.name",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "name",
                    label: "Name",
                    placeholderText: "test-file",
                    requiresEncoding: true,
                    subtitle: "Search for files containing the given name.",
                    tooltipText: "Search for files containing the given name. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.path",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "path",
                    label: "Path",
                    placeholderText: "/myNewFolder",
                    subtitle: "Search files by path of the file",
                    tooltipText: "Search files by path. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.parentFolderId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "parentFolderId",
                    label: "Parent folder ID",
                    placeholderText: "68720958502",
                    subtitle: "Search files within given folder ID.",
                    tooltipText: "Search files within given folder ID. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.size",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "size",
                    label: "Size",
                    placeholderText: "187158",
                    subtitle: "Query by file size. ",
                    tooltipText: "Query by file size.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.height",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "height",
                    label: "Height",
                    placeholderText: "633",
                    subtitle: "Search files by height of image or video. ",
                    tooltipText: "Search files by height of image or video. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.width",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "width",
                    label: "Width",
                    placeholderText: "1206",
                    subtitle: "Search files by width of image or video. ",
                    tooltipText: "Search files by width of image or video. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.enconding",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "enconding",
                    label: "Enconding",
                    placeholderText: "png",
                    requiresEncoding: true,
                    subtitle: "Search files with specified encoding.",
                    tooltipText: "Search files with specified encoding. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.type",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "type",
                    label: "Type",
                    placeholderText: "IMG",
                    requiresEncoding: true,
                    subtitle: "Filter by provided file type. ",
                    tooltipText: "Filter by provided file type. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.extension",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "extension",
                    label: "Extension",
                    placeholderText: "png",
                    requiresEncoding: true,
                    subtitle: "Search files by given extension.",
                    tooltipText: "Search files by given extension. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.url",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "url",
                    label: "URL",
                    placeholderText:
                      "https://21513.fs1.hubspotusercontent-na1.net/hubfs/215149/myNewFolder/test-file.png",
                    subtitle: "Search for given URL.",
                    tooltipText: "Search for given URL. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.isUsableInContent",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "isUsableInContent",
                    initialValue: "false",
                    label: "Is usable in content",
                    placeholderText: "false",
                    subtitle:
                      "If true, shows files that have been marked to be used in new content. ",
                    tooltipText:
                      "If true shows files that have been marked to be used in new content. It false shows files that should not be used in new content. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.allowsAnonymousAccess",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "allowsAnonymousAccess",
                    initialValue: "false",
                    label: "Allows anonymous access",
                    placeholderText: "false",
                    subtitle:
                      "If 'true' will show private files; if 'false' will show public files. ",
                    tooltipText:
                      "If 'true' will show private files; if 'false' will show public files.",
                  },
                ],
                name: "Search File",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'SEARCH_FILE'}}",
                },
              },
              {
                identifier: "SEARCH_FOLDERS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "properties",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Properties that should be included in the returned folders.",
                    subtitle: "Desired folder properties in the return object.",
                    label: "Properties",
                    configProperty: "actionConfiguration.formData.properties",
                  },
                  {
                    identifier: "after",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                    subtitle:
                      "To obtain the token look for the next page token or after field, in the response.",
                    label: "Next page token",
                    placeholderText: " AAAAAQ",
                    configProperty: "actionConfiguration.formData.after",
                  },
                  {
                    identifier: "before",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                    subtitle:
                      "To obtain the token look for the next page token or before field, in the response.",
                    label: "Before page token",
                    placeholderText: "AAAAAQ",
                    configProperty: "actionConfiguration.formData.before",
                  },
                  {
                    identifier: "limit",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    initialValue: "10",
                    tooltipText:
                      "Maximum number of results to return. Default is 100.",
                    subtitle: "The maximum number of result per page. ",
                    label: "Limit",
                    placeholderText: "10",
                    configProperty: "actionConfiguration.formData.limit",
                  },
                  {
                    identifier: "sort",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Sort results by given property. For example -name sorts by name field descending, name sorts by name field ascending. type: array",
                    subtitle: "Columns names to sort the result by.",
                    label: "Sort",
                    configProperty: "actionConfiguration.formData.sort",
                  },
                  {
                    identifier: "id",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "Identifier of the folder",
                    subtitle: "Search folder by given ID. ",
                    label: "ID",
                    placeholderText: "74498869791",
                    configProperty: "actionConfiguration.formData.id",
                  },
                  {
                    identifier: "createdAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Search for folders with the given creation timestamp. ",
                    subtitle:
                      "Return folders created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    label: "CreatedAt",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    configProperty: "actionConfiguration.formData.createdAt",
                  },
                  {
                    identifier: "createdAtLte",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Search folders by time of creation in Lte format.",
                    subtitle:
                      "Return folders created before this date in Lte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    label: "Created at Lte",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    configProperty: "actionConfiguration.formData.createdAtLte",
                  },
                  {
                    identifier: "createdAtGte",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Search folders by time of creation in Gte format. ",
                    subtitle:
                      "Return folders created before this date in Gte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    label: "Created at Gte",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    configProperty: "actionConfiguration.formData.createdAtGte",
                  },
                  {
                    identifier: "updatedAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Search for folder at given update timestamp. ",
                    subtitle:
                      "Return folders updated at this date. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    label: "Updated at",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    configProperty: "actionConfiguration.formData.updatedAt",
                  },
                  {
                    identifier: "updatedAtLte",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Search folders by time of latest updated in Lte. ",
                    subtitle:
                      "Return folders updated at this date in Lte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    label: "Updated at Lte",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    configProperty: "actionConfiguration.formData.updatedAtLte",
                  },
                  {
                    identifier: "updatedAtGte",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Search folders by time of latest updated in Gte. ",
                    subtitle:
                      "Return folders updated at this date in Gte. Format: YYYY-MM-DDThh:mm:ss.sZ",
                    label: "Updated at Gte",
                    placeholderText: "2022-04-29T00:00:00.000Z",
                    configProperty: "actionConfiguration.formData.updatedAtGte",
                  },
                  {
                    identifier: "name",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "Search for folders containing the specified name. ",
                    subtitle: "Search for folders containing the given name.",
                    label: "Name",
                    placeholderText: "test-file",
                    configProperty: "actionConfiguration.formData.name",
                  },
                  {
                    identifier: "path",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "Search folders by path. ",
                    subtitle: "Search folders by path. ",
                    label: "Path",
                    placeholderText: "/myNewFolder",
                    configProperty: "actionConfiguration.formData.path",
                  },
                  {
                    identifier: "parentFolderId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Search for folders with the given parent folder ID. ",
                    subtitle: "Search folders given parent folder ID.",
                    label: "Parent folder ID",
                    placeholderText: "68720958502",
                    configProperty:
                      "actionConfiguration.formData.parentFolderId",
                  },
                ],
                name: "Search folders",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'SEARCH_FOLDERS'}}",
                },
              },
              {
                identifier: "EXPORT_PUBLISHED_VERSION_TABLE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "format",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "The file format to export. Possible values include CSV, XLSX, and XLS. ",
                    subtitle: "Format file to export.",
                    label: "Format",
                    placeholderText: "CSV",
                    configProperty: "actionConfiguration.formData.format",
                  },
                  {
                    identifier: "tableIdOrName",
                    isRequired: true,
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table ID or name. ",
                    placeholderText: "test_table",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                  },
                ],
                name: "Export published Version table",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'EXPORT_PUBLISHED_VERSION_TABLE'}}",
                },
              },
              {
                identifier: "DELETE_FILE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "fileId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "File ID",
                    configProperty: "actionConfiguration.formData.fileId",
                    isRequired: true,
                    tooltipText:
                      "Identifier that was used when the file was created. ",
                    subtitle: "File ID to delete. ",
                    requiresEncoding: true,
                    placeholderText: "76030562986",
                  },
                ],
                name: "Delete File",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'DELETE_FILE'}}",
                },
              },
              {
                identifier: "PERMANENTLY_DELETE_ROWS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "tableIdOrName",
                    isRequired: true,
                    requiresEncoding: false,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table ID or name.",
                    placeholderText: "test_table",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                  },
                  {
                    identifier: "inputs",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "ID rows that want to get. type: array.",
                    subtitle: "Row ID. ",
                    placeholderText: "[”5378084”,”71003521”]",
                    label: "Inputs",
                    configProperty: "actionConfiguration.formData.inputs",
                    requiresEncoding: false,
                  },
                ],
                name: "Permanently Delete rows",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'PERMANENTLY_DELETE_ROWS'}}",
                },
              },
              {
                identifier: "CLONE_TABLE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Name or ID of the table to be cloned.",
                    placeholderText: "test_table",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.newName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "newName",
                    label: "New name",
                    placeholderText: "test_new_table",
                    subtitle: "Name for the cloned table. ",
                    tooltipText: "New name for the cloned table. ",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.newLabel",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "newLabel",
                    label: "New label",
                    placeholderText: "Test New table",
                    subtitle: "Name for the new label. ",
                    tooltipText: "New label for the cloned table.",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.copyRows",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "copyRows",
                    isRequired: true,
                    label: "Copy rows",
                    subtitle: "If true, rows should be copied during cloning. ",
                    tooltipText:
                      "Specifies whether to copy the rows during clone. Default Value: false",
                    placeholderText: "false",
                    initialValue: "false",
                  },
                ],
                name: "Clone table",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CLONE_TABLE'}}",
                },
              },
              {
                identifier: "UPDATE_OBJECT",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "objectType",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    configProperty: "actionConfiguration.formData.objectType",
                    label: "Object type",
                    placeholderText: "contacts ",
                    subtitle: "Valid object type for the CRM.",
                    tooltipText:
                      "Valid object type for the CRM (contacts, companies, deals, tickets, etc.)",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.objectId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "objectId",
                    isRequired: true,
                    label: "Object ID",
                    placeholderText: "201",
                    subtitle: "Identifier of the object.",
                    tooltipText:
                      "Identifier that was used when the object was created. If you do not remember it, you can use list objects to find the id.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.properties",
                    controlType: "QUERY_DYNAMIC_TEXT",
                    identifier: "properties",
                    isRequired: true,
                    label: "Properties",
                    placeholderText:
                      '{ "company": "Elv",    "email": "test@elv.net",    "firstname": "Test",         "lastname": "Cooper", "phone": "(877)112-05252", "website": "biglytics.net"}',
                    requiresEncoding: false,
                    subtitle: "Json format the properties.",
                    tooltipText:
                      "A properties object for the specific objecType.",
                  },
                ],
                name: "Update object",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'UPDATE_OBJECT'}}",
                },
              },
              {
                identifier: "DELETE_FOLDER",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "folderId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    requiresEncoding: true,
                    tooltipText: "Identifier of folder to delete. ",
                    subtitle: "Folder ID to delete.",
                    label: "Folder ID",
                    placeholderText: "74302751362",
                    configProperty: "actionConfiguration.formData.folderId",
                  },
                ],
                name: "Delete folder",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'DELETE_FOLDER'}}",
                },
              },
              {
                identifier: "DELETE_A_REDIRECT",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "urlRedirectId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "URL redirect ID",
                    configProperty:
                      "actionConfiguration.formData.urlRedirectId",
                    isRequired: true,
                    requiresEncoding: true,
                    tooltipText:
                      "Identifier that was used when the URL redirect was created. If you do not remember it, you can use get current redirects to find the id.",
                    subtitle: "Write the ID of the target redirect.",
                    placeholderText: "71783843089",
                  },
                ],
                name: "Delete a redirect",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'DELETE_A_REDIRECT'}}",
                },
              },
              {
                identifier: "REPLACE_EXISTING_ROW",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table ID or name.",
                    placeholderText: "test_table",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    isRequired: true,
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.rowId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "rowId",
                    label: "Row ID",
                    placeholderText: "5378084",
                    subtitle: "Row ID. ",
                    tooltipText: "The ID of the row.",
                    isRequired: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.path",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "path",
                    label: "Path",
                    placeholderText: "test_path",
                    subtitle: "The value for hs_path column. ",
                    tooltipText:
                      "Value for hs_path  column, which will be used as slug in the dynamic pages. ",
                    requiresEncoding: false,
                    initialValue: "null",
                  },
                  {
                    configProperty: "actionConfiguration.formData.name",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "name",
                    label: "Name",
                    subtitle: "Write the value for hs_name column.",
                    tooltipText:
                      "Specifies the value for hs_name  column, which will be used as title in the dynamic pages. (String)",
                    placeholderText: "text_title",
                    initialValue: "null",
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.childTableId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "childTableId",
                    label: "Child table ID",
                    placeholderText: "5378084",
                    subtitle: "Value for the column child table id. ",
                    tooltipText: "Value for the column child table id. ",
                    initialValue: "null",
                  },
                  {
                    configProperty: "actionConfiguration.formData.values",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "values",
                    isRequired: true,
                    label: "Values",
                    placeholderText:
                      '{     "text_column": "sample text value",     "multiselect": [       {         "id": "1",         "name": "Option 1",         "type": "option",         "order": 0       },       {         "id": "2",         "name": "Option 2",         "type": "option",         "order": 1       }     ]   }',
                    requiresEncoding: false,
                    subtitle: "Key value pairs. ",
                    tooltipText:
                      "List of key value pairs with the column name and column value. type: array.",
                  },
                ],
                name: "Replace Existing Row",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'REPLACE_EXISTING_ROW'}}",
                },
              },
              {
                identifier: "RETRIEVE_LIST_USERS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "limit",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "Limit",
                    configProperty: "actionConfiguration.formData.limit",
                    initialValue: "10",
                    placeholderText: "10",
                    tooltipText: "The number of users to retrieve. ",
                    subtitle: "The maximum number of results per page.",
                  },
                  {
                    identifier: "after",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "Next page token",
                    configProperty: "actionConfiguration.formData.after",
                    requiresEncoding: true,
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                    subtitle:
                      "To obtain the token look for the next page token or after field, in the response.",
                    placeholderText: "Q0o3TjhRVQ%3D%3D",
                  },
                ],
                name: "Retrieve list users",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'RETRIEVE_LIST_USERS'}}",
                },
              },
              {
                identifier: "ARCHIVE_TABLE",
                controlType: "SECTION",
                children: [
                  {
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "tableIdOrName",
                    label: "Table ID or name",
                    requiresEncoding: true,
                    subtitle: "Table name or ID to archive.",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    isRequired: true,
                    placeholderText: "test_table",
                  },
                ],
                name: "Archive table",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'ARCHIVE_TABLE'}}",
                },
              },
              {
                identifier: "PERMANENTLY_DELETE_A_ROW",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "tableIdOrName",
                    isRequired: true,
                    requiresEncoding: false,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table ID or name.",
                    placeholderText: "test_table",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                  },
                  {
                    identifier: "rowId",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "The ID of the row. ",
                    subtitle: "Row ID.  ",
                    placeholderText: "5378084",
                    label: "Row ID",
                    configProperty: "actionConfiguration.formData.rowId",
                  },
                ],
                name: "Permanently Delete a Row",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'PERMANENTLY_DELETE_A_ROW'}}",
                },
              },
              {
                identifier: "GET_SET_ROWS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table ID or name. ",
                    placeholderText: "test_table",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    isRequired: true,
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.inputs",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "inputs",
                    label: "Inputs",
                    placeholderText: "[”5378084”,”71003521”]",
                    subtitle: "List with row IDs ",
                    tooltipText: "ID rows that want to get. type: array.",
                    isRequired: true,
                    requiresEncoding: false,
                  },
                ],
                name: "Get Set rows",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_SET_ROWS'}}",
                },
              },
              {
                identifier: "CREATE_A_REDIRECT",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "routePrefix",
                    isRequired: true,
                    requiresEncoding: false,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The incoming URL, path, or pattern to match. If you do not remember how its looks, you can use get current redirects to find routePrefix examples.",
                    subtitle: "Incoming URL, path or pattern to match.",
                    placeholderText: "/the-original-source",
                    label: "Route prefix",
                    configProperty: "actionConfiguration.formData.routePrefix",
                  },
                  {
                    identifier: "destination",
                    isRequired: true,
                    requiresEncoding: false,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The destination URL, where the target URL should be redirected if it matches the routePrefix. If you do not remember how its looks, you can use get current redirects to find destination examples.",
                    subtitle: "Destination URL",
                    placeholderText:
                      "http://62515.sites.hubspot.com/the-destination-url",
                    label: "Destination",
                    configProperty: "actionConfiguration.formData.destination",
                  },
                  {
                    identifier: "redirectStyle",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The type of redirect to create. Options include: 301 (permanent), 302 (temporary), or 305 (proxy). ",
                    subtitle: "Type of redirect to create. ",
                    placeholderText: "301",
                    label: "Redirect style",
                    initialValue: "301",
                    configProperty:
                      "actionConfiguration.formData.redirectStyle",
                  },
                  {
                    identifier: "precedence",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Used to prioritize URL redirection. If a given URL matches more than one redirect, the one with the lower precedence will be used. ",
                    subtitle: "Prioritize URL redirection. ",
                    placeholderText: "0",
                    label: "Precedence",
                    initialValue: "0",
                    configProperty: "actionConfiguration.formData.precedence",
                  },
                  {
                    identifier: "isOnlyAfterNotFound",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Whether the URL redirect mapping should apply only if a live page on the URL isn't found. If False, the URL redirect mapping will take precedence over any existing page.",
                    subtitle:
                      "If true, URL redirect mapping should apply only if a live page on the URL isn't found. ",
                    placeholderText: "false",
                    label: " Is only after not found",
                    initialValue: "false",
                    configProperty:
                      "actionConfiguration.formData.isOnlyAfterNotFound",
                  },
                  {
                    identifier: "isMatchFullUrl",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "If true, the 'routePrefix' should match on the entire URL including the domain. ",
                    subtitle:
                      "If true, the 'routePrefix' should match on the entire URL including the domain.",
                    placeholderText: "false",
                    label: "Is match full URL",
                    initialValue: "false",
                    configProperty:
                      "actionConfiguration.formData.isMatchFullUrl",
                  },
                  {
                    identifier: "isMatchQueryString",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "If true, the 'routePrefix' should match on the entire URL path including the query string. ",
                    subtitle:
                      "If true 'routePrefix' should match on the entire URL path. ",
                    placeholderText: "false",
                    label: "Is match query string",
                    initialValue: "false",
                    configProperty:
                      "actionConfiguration.formData.isMatchQueryString",
                  },
                  {
                    identifier: "isPattern",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Set to true if you are creating a flexible pattern based URL mapping. ",
                    subtitle:
                      "If true, create a flexible pattern based URL mapping. ",
                    placeholderText: "false",
                    label: "Is pattern",
                    initialValue: "false",
                    configProperty: "actionConfiguration.formData.isPattern",
                  },
                  {
                    identifier: "isTrailingSlashOptional",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "Whether a trailing slash will be ignored. ",
                    subtitle: "If true, a trailing slash will be ignored. ",
                    placeholderText: "false",
                    label: "Is trailing slash optional ",
                    initialValue: "false",
                    configProperty:
                      "actionConfiguration.formData.isTrailingSlashOptional",
                  },
                  {
                    identifier: "isProtocolAgnostic",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Whether the routePrefix  should match both HTTP and HTTPS protocols. ",
                    subtitle:
                      "If true,  the routePrefixmatch both HTTP and HTTPS protocols. ",
                    placeholderText: "false",
                    label: "Is protocol agnostic",
                    initialValue: "false",
                    configProperty:
                      "actionConfiguration.formData.isProtocolAgnostic",
                  },
                ],
                name: "Create a redirect",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CREATE_A_REDIRECT'}}",
                },
              },
              {
                identifier: "RETRIEVES_USER",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "idProperty",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "ID property",
                    configProperty: "actionConfiguration.formData.idProperty",
                    tooltipText:
                      "The name of a property with unique user values. Valid values are USER_ID(default) or EMAIL.",
                    subtitle: "Name of a property with unique user values.",
                  },
                  {
                    identifier: "userId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "User ID",
                    configProperty: "actionConfiguration.formData.userId",
                    isRequired: true,
                    tooltipText: "Identifier of user to retrieve. ",
                    subtitle: "Identifier of user to retrieve. ",
                    placeholderText: "13358977",
                  },
                ],
                name: "Retrieves User",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'RETRIEVES_USER'}}",
                },
              },
              {
                identifier: "UPDATE_EXISTING_ROW",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "tableIdOrName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Identifier that was used when the table was created. If you do not remember it, you can use get published table to find the table ID or the name.",
                    subtitle: "Table name or ID to return  details.",
                    placeholderText: "test_table",
                    label: "Table ID or name",
                    configProperty:
                      "actionConfiguration.formData.tableIdOrName",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.rowId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "rowId",
                    label: "Row ID",
                    placeholderText: "5378084",
                    subtitle: "Row ID. ",
                    tooltipText: "The ID of the row. ",
                    isRequired: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.path",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "path",
                    label: "Path",
                    placeholderText: "test_path",
                    subtitle: "The value for hs_path column.",
                    tooltipText:
                      "Value for hs_path  column, which will be used as slug in the dynamic pages. ",
                    requiresEncoding: false,
                    initialValue: "null",
                  },
                  {
                    configProperty: "actionConfiguration.formData.name",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "name",
                    label: "Name",
                    subtitle: "Value for hs_name column.",
                    tooltipText:
                      "Value for hs_name  column, which will be used as title in the dynamic pages.",
                    placeholderText: "text_title",
                    initialValue: "null",
                    requiresEncoding: false,
                  },
                  {
                    configProperty: "actionConfiguration.formData.childTableId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "childTableId",
                    label: "Child table ID",
                    placeholderText: "5378084",
                    subtitle: "Value for the column child table id.",
                    tooltipText: "Value for the column child table id.",
                    initialValue: "null",
                  },
                  {
                    configProperty: "actionConfiguration.formData.values",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "values",
                    isRequired: true,
                    label: "Values",
                    placeholderText:
                      '{     "text_column": "sample text value",     "multiselect": [       {         "id": "1",         "name": "Option 1",         "type": "option",         "order": 0       },       {         "id": "2",         "name": "Option 2",         "type": "option",         "order": 1       }     ]   }',
                    requiresEncoding: false,
                    subtitle: "Key value pairs. ",
                    tooltipText:
                      "List of key value pairs with the column name and column value. type: array.",
                  },
                ],
                name: "Update Existing Row",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'UPDATE_EXISTING_ROW'}}",
                },
              },
              {
                identifier: "GET_PUBLISHED_TABLES",
                controlType: "SECTION",
                children: [
                  {
                    configProperty: "actionConfiguration.formData.sort",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "sort",
                    label: "Sort",
                    subtitle:
                      "Fields to use for sorting results. array with fields to use for sorting results.",
                    tooltipText:
                      "Fields to use for sorting results. Valid fields are name, createdAt, updatedAt, createdBy, updatedBy. createdAt will be used by default. type: array.",
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.after",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "after",
                    label: "Next page token",
                    subtitle:
                      "To obtain the token look for the next page token or after field, in the response.",
                    tooltipText:
                      "The token returned in the cursor field of the response.",
                    requiresEncoding: true,
                    placeholderText: "MTA%3D",
                  },
                  {
                    configProperty: "actionConfiguration.formData.limit",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "limit",
                    initialValue: "1000",
                    label: "Limit",
                    placeholderText: "10",
                    subtitle:
                      "The maximum number of published tables to return. ",
                    tooltipText:
                      "Maximum number of results to return. Default is 1000.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.createdAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "createdAt",
                    label: "Created at",
                    placeholderText: "2019-03-15T21:20:51.556Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains created at this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                    tooltipText:
                      "Only return tables created at exactly the specified time. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.createdAfter",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "createdAfter",
                    label: "Created after",
                    placeholderText: "2019-03-15T21:20:51.556Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains created after this date. Format: YYYY-MM-DDThh:mm:ss.sZ. ",
                    tooltipText:
                      "Only return tables created after the specified time. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.createdBefore",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "createdBefore",
                    label: "Created before",
                    placeholderText: "2019-03-15T21:20:51.556Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains created before this date. Format: YYYY-MM-DDThh:mm:ss.sZ.",
                    tooltipText:
                      "Only return tables created before the specified time. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAt",
                    label: "Updated at",
                    placeholderText: "2020-04-02T16:00:43.880Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains updated at this date. Format YYYY-MM-DDThh:mm:ss.sZ.",
                    tooltipText:
                      "Only return tables last updated at exactly the specified time. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.updatedAfter",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedAfter",
                    label: "Updated after",
                    placeholderText: "2020-04-02T16:00:43.880Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains updated after this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                    tooltipText:
                      "Only return tables last updated after the specified time. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.updatedBefore",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "updatedBefore",
                    label: "Updated before",
                    placeholderText: "2020-04-02T16:00:43.880Z",
                    requiresEncoding: true,
                    subtitle:
                      "Return domains updated before this date.  Format: YYYY-MM-DDThh:mm:ss.sZ.",
                    tooltipText:
                      "Only return tables last updated before the specified time. ",
                  },
                  {
                    configProperty: "actionConfiguration.formData.archived",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "archived",
                    initialValue: "false",
                    label: "Archive",
                    placeholderText: "false",
                    requiresEncoding: false,
                    subtitle: "Whether to return only archived results.",
                    tooltipText:
                      "Specifies whether to return archived tables. Defaults to false. ",
                  },
                ],
                name: "Get published tables",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_PUBLISHED_TABLES'}}",
                },
              },
              {
                identifier: "LIST_OBJECTS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "objectType",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    tooltipText:
                      "Valid object type for the CRM (contacts, companies, deals, tickets, etc.)",
                    subtitle: "Valid object type for the CRM.",
                    label: "Object type",
                    placeholderText: "contacts",
                    configProperty: "actionConfiguration.formData.objectType",
                  },
                ],
                name: "List objects",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'LIST_OBJECTS'}}",
                },
              },
              {
                identifier: "UPDATE_FOLDER_PROPERTIES",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "id",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    tooltipText: "Identifier of the folder to change. ",
                    subtitle: "Folder ID to change.",
                    label: "ID",
                    placeholderText: "74302751362",
                    configProperty: "actionConfiguration.formData.id",
                  },
                  {
                    identifier: "name",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "New name. If specified the folder's name and fullPath will change. All children of the folder will be updated accordingly.",
                    subtitle: "New folder name. ",
                    label: "Name",
                    placeholderText: "myNewFolder",
                    configProperty: "actionConfiguration.formData.name",
                  },
                  {
                    identifier: "parentFolderId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    requiresEncoding: true,
                    tooltipText:
                      "New parent folder ID. If changed, the folder and all it's children will be moved into the specified folder. parentFolderId and parentFolderPath cannot be specified at the same time.  ",
                    subtitle: "New parent folder ID. ",
                    label: "Parent folder ID",
                    placeholderText: "/myFolder",
                    configProperty:
                      "actionConfiguration.formData.parentFolderId",
                  },
                ],
                name: "Update folder Properties",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'UPDATE_FOLDER_PROPERTIES'}}",
                },
              },
              {
                identifier: "GET_SINGLE_DOMAINS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "archived",
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Specifies whether to return archived tables. Defaults to false. ",
                    subtitle: "Whether to return only archived results.",
                    label: "Archived",
                    configProperty: "actionConfiguration.formData.archived",
                    placeholderText: "false",
                    initialValue: "false",
                  },
                  {
                    identifier: "Id",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "The unique ID of the domain. ",
                    subtitle: "The ID or name of the domain.",
                    label: "ID",
                    configProperty: "actionConfiguration.formData.Id",
                    requiresEncoding: true,
                    placeholderText: "789442651352",
                  },
                ],
                name: "Get Single Domains",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'GET_SINGLE_DOMAINS'}}",
                },
              },
              {
                identifier: "MODIFY_USER",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "idProperty",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "ID property",
                    configProperty: "actionConfiguration.formData.idProperty",
                    tooltipText:
                      "The name of a property with unique user values. Valid values are USER_ID(default) or EMAIL. ",
                    subtitle: "Name of a property with unique user values.",
                  },
                  {
                    identifier: "userId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    label: "User ID",
                    configProperty: "actionConfiguration.formData.userId",
                    isRequired: true,
                    tooltipText: "Identifier of user to retrieve. ",
                    subtitle: "Identifier of user to retrieve.",
                    placeholderText: "13358977",
                  },
                  {
                    configProperty: "actionConfiguration.formData.roleId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "roleId",
                    initialValue: "null",
                    label: "Role ID",
                    placeholderText: "310427",
                    tooltipText: "The user's role. ",
                    subtitle: "User role ID. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.primaryTeamId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "primaryTeamId",
                    initialValue: "null",
                    label: "Primary team ID",
                    placeholderText: "7824745",
                    tooltipText: "The user's primary team. ",
                    subtitle: "User primary team ID. ",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.secondaryTeamIds",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "secondaryTeamIds",
                    initialValue: "[]",
                    label: "Secondary team IDs",
                    placeholderText: "[”7885423”,”78525623”]",
                    tooltipText: "The user's additional teams. type: array",
                    subtitle: "User additional teams IDs.  ",
                  },
                ],
                name: "Modify User",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'MODIFY_USER'}}",
                },
              },
            ],
          },
          datasourceUiConfig: {
            form: [
              {
                sectionName: "Connection",
                children: [
                  {
                    label: "Authentication type",
                    description: "Select the authentication type to use",
                    configProperty:
                      "datasourceConfiguration.authentication.authenticationType",
                    controlType: "DROP_DOWN",
                    options: [
                      {
                        label: "Bearer token",
                        value: "bearerToken",
                      },
                    ],
                  },
                  {
                    identifier: "bearerToken",
                    label: "Bearer token",
                    configProperty:
                      "datasourceConfiguration.authentication.bearerToken",
                    controlType: "INPUT_TEXT",
                    dataType: "PASSWORD",
                    encrypted: true,
                    hidden: {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "bearerToken",
                    },
                  },
                ],
              },
            ],
          },
          templates: {},
          remotePlugin: true,
          new: false,
        },
        {
          id: "653236465e9a6424e4c04b78",
          userPermissions: [],
          name: "Twilio",
          type: "REMOTE",
          packageName: "saas-plugin",
          pluginName: "twilio-1.2-plugin",
          iconLocation: "https://assets.appsmith.com/integrations/twilio1.png",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/twilio#create-queries",
          responseType: "JSON",
          version: "1.0",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "AutoForm",
          allowUserDatasources: true,
          isRemotePlugin: true,
          actionUiConfig: {
            editor: [
              {
                label: "Command",
                description: "Select the method to run",
                configProperty: "actionConfiguration.formData.command",
                controlType: "DROP_DOWN",
                options: [
                  {
                    index: 1,
                    label: "Create message",
                    value: "CREATE_MESSAGE",
                  },
                  {
                    index: 2,
                    label: "Schedule message",
                    value: "SCHEDULE_MESSAGE",
                  },
                  {
                    index: 3,
                    label: "List message",
                    value: "LIST_MESSAGE",
                  },
                  {
                    index: 4,
                    label: "Fetch message",
                    value: "FETCH_MESSAGE",
                  },
                  {
                    index: 5,
                    label: "Delete message",
                    value: "DELETE_MESSAGE",
                  },
                  {
                    index: 6,
                    label: "Cancel message",
                    value: "CANCEL_MESSAGE",
                  },
                ],
              },
              {
                identifier: "SCHEDULE_MESSAGE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "TWILIO_ACCOUNT_SID",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The SID of the account that will create the resource.",
                    subtitle:
                      "Specify the SID of the account. This is the same value used at datasource creation.",
                    label: "Twilio account SID",
                    configProperty:
                      "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
                    placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                  },
                  {
                    identifier: "MessagingServiceSid",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The SID of the messaging Service  used with the message. The value is null if a messaging Service was not used.",
                    subtitle:
                      "Specify the SID of the messaging Service used with the message.",
                    label: "Messaging service SID",
                    configProperty:
                      "actionConfiguration.formData.MessagingServiceSid",
                    placeholderText: "MGXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                  },
                  {
                    identifier: "To",
                    isRequired: true,
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The destination phone number in E.164 format for SMS/MMS or channel user address for other 3rd-party channels.",
                    subtitle: "Destination phone number",
                    label: "To",
                    configProperty: "actionConfiguration.formData.To",
                    placeholderText: "+123456789",
                  },
                  {
                    identifier: "Body",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The message text. Can be up to 1,600 characters long.",
                    subtitle: "Specify the message text",
                    placeholderText: "Hi there",
                    label: "Body",
                    configProperty: "actionConfiguration.formData.Body",
                    isRequired: true,
                    requiresEncoding: true,
                  },
                  {
                    configProperty: "actionConfiguration.formData.SendAt",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "SendAt",
                    isRequired: true,
                    label: "Send at",
                    placeholderText: "2021-11-30T20:36:27Z",
                    requiresEncoding: true,
                    subtitle:
                      "Define the time that Twilio will send the message. Must be in UTC format: YYYY-MM-DDTHH:MM:SSZ",
                    tooltipText:
                      "The time that Twilio will send the message. Must be in UTC format.",
                  },
                ],
                name: "Schedule message",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'SCHEDULE_MESSAGE'}}",
                },
              },
              {
                identifier: "LIST_MESSAGE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "To",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Read messages sent to only this phone number.",
                    subtitle: "Destination phone number",
                    label: "To",
                    configProperty: "actionConfiguration.formData.To",
                    placeholderText: "+123456789",
                    requiresEncoding: true,
                  },
                  {
                    identifier: "From",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Read messages sent from only this phone number or alphanumeric sender ID.",
                    subtitle: "Read messages sent from only this phone number.",
                    label: "From",
                    configProperty: "actionConfiguration.formData.From",
                    placeholderText: "+123456789",
                    requiresEncoding: true,
                  },
                  {
                    identifier: "DateSent",
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The date of the messages to show. Specify a date as YYYY-MM-DD in GMT to read only messages sent on this date. For example: 2009-07-06. ",
                    subtitle: "Define the date of the messages to show",
                    label: "DateSent",
                    configProperty: "actionConfiguration.formData.DateSent",
                    placeholderText: "YYYY-MM-DD",
                  },
                  {
                    identifier: "PageSize",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "Number of records to pull.",
                    subtitle: "Write the number of records to pull",
                    placeholderText: "{{ table1.pageSize }}",
                    label: "Page size",
                    configProperty: "actionConfiguration.formData.PageSize",
                    requiresEncoding: false,
                    initialValue: "2",
                  },
                  {
                    configProperty:
                      "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "TWILIO_ACCOUNT_SID",
                    isRequired: true,
                    label: "Twilio account SID",
                    placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    subtitle:
                      "Specify the SID of the account. This is the same value used at datasource creation.",
                    tooltipText:
                      "The SID of the account that will fetch the resource.",
                  },
                ],
                name: "List message",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'LIST_MESSAGE'}}",
                },
              },
              {
                identifier: "FETCH_MESSAGE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "TWILIO_ACCOUNT_SID",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The SID of the account that will fetch the resource.",
                    subtitle:
                      "Specify the SID of the account. This is the same value used at datasource creation.",
                    placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    label: "Twilio account SID",
                    configProperty:
                      "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
                  },
                  {
                    configProperty: "actionConfiguration.formData.MESSAGE_SID",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "MESSAGE_SID",
                    isRequired: true,
                    label: "Message SID",
                    placeholderText: "MMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    subtitle: "Specify the SID of the message.",
                    tooltipText:
                      "The Twilio-provided string that uniquely identifies the message resource to fetch.",
                  },
                ],
                name: "Fetch message",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'FETCH_MESSAGE'}}",
                },
              },
              {
                identifier: "CREATE_MESSAGE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "TWILIO_ACCOUNT_SID",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The SID of the account that will create the resource.",
                    subtitle:
                      "Specify the SID of the account. This is the same value used at datasource creation.",
                    placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    label: "Twilio account SID",
                    configProperty:
                      "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
                  },
                  {
                    configProperty: "actionConfiguration.formData.To",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "To",
                    isRequired: true,
                    label: "To",
                    placeholderText: "+123456789",
                    requiresEncoding: true,
                    subtitle: "Destination phone number",
                    tooltipText:
                      "The destination phone number in E.164 format for SMS/MMS or channel user address for other 3rd-party channels.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.Fom",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "Fom",
                    isRequired: true,
                    label: "From",
                    placeholderText: "+123456789",
                    requiresEncoding: true,
                    subtitle: "Write a Twilio phone number",
                    tooltipText:
                      "A Twilio phone number in E.164 format, an alphanumeric sender ID, or a channel Endpoint address that is enabled for the type of message you want to send. Phone numbers or short codes purchased from Twilio also work here. You cannot, for example, spoof messages from a private cell phone number. If you are using messaging_service_sid, this parameter must be empty.",
                  },
                  {
                    configProperty: "actionConfiguration.formData.Body",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "Body",
                    isRequired: true,
                    label: "Body",
                    placeholderText: "Hi there",
                    requiresEncoding: true,
                    subtitle: "Specify the message text",
                    tooltipText:
                      "The message text. Can be up to 1,600 characters long.",
                  },
                ],
                name: "Create message",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CREATE_MESSAGE'}}",
                },
              },
              {
                identifier: "CANCEL_MESSAGE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "TWILIO_ACCOUNT_SID",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    tooltipText:
                      "The SID of the account that will update the resource.",
                    subtitle:
                      "Specify the SID of the account. This is the same value used at datasource creation.",
                    label: "Twilio account SID",
                    placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    configProperty:
                      "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
                  },
                  {
                    identifier: "MESSAGE_SID",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    tooltipText:
                      "The Twilio-provided string that uniquely identifies the message resource to fetch.",
                    subtitle: "Specify the SID of the message.",
                    label: "Message SID",
                    placeholderText: "SMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    configProperty: "actionConfiguration.formData.MESSAGE_SID",
                  },
                ],
                name: "Cancel message",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CANCEL_MESSAGE'}}",
                },
              },
              {
                identifier: "DELETE_MESSAGE",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "TWILIO_ACCOUNT_SID",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The SID of the account that created the message resources to delete.",
                    subtitle:
                      "Specify the SID of the account. This is the same value used at datasource creation.",
                    placeholderText: "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    label: "Twilio account SID",
                    configProperty:
                      "actionConfiguration.formData.TWILIO_ACCOUNT_SID",
                  },
                  {
                    configProperty: "actionConfiguration.formData.MESSAGE_SID",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "MESSAGE_SID",
                    isRequired: true,
                    label: "Message SID",
                    placeholderText: "MMXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
                    subtitle: "Specify the SID of the message.",
                    tooltipText:
                      "The Twilio-provided string that uniquely identifies the message resource to delete.",
                  },
                ],
                name: "Delete message",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'DELETE_MESSAGE'}}",
                },
              },
            ],
          },
          datasourceUiConfig: {
            form: [
              {
                sectionName: "Connection",
                children: [
                  {
                    label: "Authentication type",
                    description: "Select the authentication type to use",
                    configProperty:
                      "datasourceConfiguration.authentication.authenticationType",
                    controlType: "DROP_DOWN",
                    options: [
                      {
                        label: "Basic auth",
                        value: "basic",
                      },
                    ],
                  },
                  {
                    identifier: "username",
                    label: "Account SID",
                    configProperty:
                      "datasourceConfiguration.authentication.username",
                    controlType: "INPUT_TEXT",
                    hidden: {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "basic",
                    },
                  },
                  {
                    identifier: "password",
                    label: "Auth token",
                    configProperty:
                      "datasourceConfiguration.authentication.password",
                    controlType: "INPUT_TEXT",
                    dataType: "PASSWORD",
                    encrypted: true,
                    hidden: {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "basic",
                    },
                  },
                ],
              },
            ],
          },
          templates: {},
          remotePlugin: true,
          new: false,
        },
        {
          id: "653236465e9a6424e4c04b79",
          userPermissions: [],
          name: "Airtable",
          type: "REMOTE",
          packageName: "saas-plugin",
          pluginName: "airtable-plugin",
          iconLocation: "https://assets.appsmith.com/integrations/airtable.svg",
          documentationLink:
            "https://docs.appsmith.com/reference/datasources/airtable#create-queries",
          responseType: "JSON",
          version: "1.0",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "AutoForm",
          allowUserDatasources: true,
          isRemotePlugin: true,
          actionUiConfig: {
            editor: [
              {
                label: "Command",
                description: "Select the method to run",
                configProperty: "actionConfiguration.formData.command",
                controlType: "DROP_DOWN",
                options: [
                  {
                    index: 1,
                    label: "List records",
                    value: "LIST_RECORDS",
                  },
                  {
                    index: 2,
                    label: "Create records",
                    value: "CREATE_RECORDS",
                  },
                  {
                    index: 3,
                    label: "Delete a record",
                    value: "DELETE_A_RECORD",
                  },
                  {
                    index: 4,
                    label: "Retrieve a record",
                    value: "RETRIEVE_A_RECORD",
                  },
                  {
                    index: 5,
                    label: "Update records",
                    value: "UPDATE_RECORDS",
                  },
                ],
              },
              {
                identifier: "UPDATE_RECORDS",
                controlType: "SECTION",
                children: [
                  {
                    configProperty: "actionConfiguration.formData.baseId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "baseId",
                    isRequired: true,
                    label: "Base ID",
                    tooltipText: "ID of Airtable base. type: String",
                    subtitle: "Airtable ID. Example: appXXXXXXXXX",
                    placeholderText: "appXXXXXXXXX",
                  },
                  {
                    configProperty: "actionConfiguration.formData.tableName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "tableName",
                    isRequired: true,
                    label: "Table name",
                    requiresEncoding: true,
                    tooltipText: "Name of table in Airtable base. type: String",
                    subtitle: "Table name. Example: Projects",
                    placeholderText: "Table name",
                  },
                  {
                    configProperty: "actionConfiguration.formData.records",
                    controlType: "QUERY_DYNAMIC_TEXT",
                    identifier: "records",
                    label: "Records",
                    isRequired: true,
                    placeholderText:
                      '[{ "id": "recehWFQ9T7NUZzF4", "fields": { "name": "Test" }}]',
                    tooltipText: "Enter records for update. type: array",
                    subtitle:
                      'Records to add in the table. Example: [{ "fields": { "name": "Test" }}]',
                  },
                ],
                name: "Update records",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'UPDATE_RECORDS'}}",
                },
              },
              {
                identifier: "DELETE_A_RECORD",
                controlType: "SECTION",
                children: [
                  {
                    configProperty: "actionConfiguration.formData.baseId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "baseId",
                    isRequired: true,
                    label: "Base ID",
                    tooltipText: "ID of Airtable base. type: Strng",
                    subtitle: "Airtable ID. Example: appXXXXXXXXX",
                    placeholderText: "appXXXXXXXXX",
                  },
                  {
                    configProperty: "actionConfiguration.formData.tableName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "tableName",
                    isRequired: true,
                    label: "Table name",
                    requiresEncoding: true,
                    tooltipText: "Name of table in Airtable base. type: String",
                    subtitle: "Table name. Example: Projects",
                    placeholderText: "Table name",
                  },
                  {
                    configProperty: "actionConfiguration.formData.recordId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "recordId",
                    isRequired: true,
                    label: "Record ID",
                    tooltipText: "ID of record to be deleted. type: String",
                    subtitle: "Record ID. Example: recXXXXXXXXXX",
                    placeholderText: "recXXXXXXXXX",
                  },
                ],
                name: "Delete a record",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'DELETE_A_RECORD'}}",
                },
              },
              {
                identifier: "CREATE_RECORDS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "baseId",
                    isRequired: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "ID of the Airtable base. type: String",
                    subtitle: "Airtable ID. Example: appXXXXXXXXX",
                    placeholderText: "appXXXXXXXXX",
                    label: "Base ID",
                    configProperty: "actionConfiguration.formData.baseId",
                  },
                  {
                    identifier: "tableName",
                    isRequired: true,
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "Name of table in Airtable base. type: String",
                    subtitle: "Table name. Example: Projects",
                    placeholderText: "Table name",
                    label: "Table name",
                    configProperty: "actionConfiguration.formData.tableName",
                  },
                  {
                    identifier: "records",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    tooltipText: "Enter records for creation. type: array",
                    subtitle:
                      'Records to add in the table. Example: [{ "fields": { "name": "Test" }}]',
                    label: "Records",
                    placeholderText: '[{ "fields": { "name": "Test" }}]',
                    configProperty: "actionConfiguration.formData.records",
                  },
                ],
                name: "Create records",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'CREATE_RECORDS'}}",
                },
              },
              {
                identifier: "LIST_RECORDS",
                controlType: "SECTION",
                children: [
                  {
                    identifier: "baseId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    isRequired: true,
                    tooltipText: "ID of Airtable base. type: String",
                    subtitle: "Airtable ID. Example: appXXXXXXXXX",
                    label: "Base ID ",
                    placeholderText: "appXXXXXXXXX",
                    configProperty: "actionConfiguration.formData.baseId",
                  },
                  {
                    identifier: "tableName",
                    isRequired: true,
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText: "Name of table in Airtable base. type: String",
                    subtitle: "Table name. Example: Projects",
                    placeholderText: "Table name",
                    label: "Table name",
                    configProperty: "actionConfiguration.formData.tableName",
                  },
                  {
                    identifier: "fields",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "Only data for fields whose names are in this list will be included in the result. If you don't need every field, you can use this parameter to reduce the amount of data transferred. type: array",
                    subtitle:
                      "Only data for fields whose names are in this list will be included in the result. ",
                    label: "Fields",
                    configProperty: "actionConfiguration.formData.fields",
                  },
                  {
                    identifier: "filterByFormula",
                    requiresEncoding: true,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      'A formula used to filter records. The formula will be evaluated for each record, and if the result is not 0,                   false,"",NaN,[], or #Error!the record will be included in the response. type: String',
                    subtitle: "A formula used to filter records.",
                    label: "Filter by formula",
                    configProperty:
                      "actionConfiguration.formData.filterByFormula",
                  },
                  {
                    identifier: "maxRecords",
                    isRequired: false,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The maximum total number of records that will be returned in your requests. If this value is larger than pageSize(which is 100 by default), you may have to load multiple pages to reach this total. type: integer",
                    subtitle:
                      "Maximum number of records to return. Example: 100",
                    placeholderText: "100",
                    label: "Max records",
                    configProperty: "actionConfiguration.formData.maxRecords",
                  },
                  {
                    identifier: "pageSize",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The number of records returned in each request. Must be less than or equal to 100. Default is 100. See the Pagination section below for more. type: Number",
                    subtitle:
                      "Maximum number of results to return. Example: 100",
                    placeholderText: "100",
                    label: "Page size",
                    initialValue: "100",
                    configProperty: "actionConfiguration.formData.pageSize",
                  },
                  {
                    identifier: "sort",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      'A list of sort objects that specifies how the records will be ordered. Each sort object must have a field               key specifying the name of the field to sort on, and an optional directionkey that is either "asc" or "desc". The default direction is "asc". type: array',
                    subtitle: "Columns names to sort the result by.",
                    label: "Sort",
                    configProperty: "actionConfiguration.formData.sort",
                  },
                  {
                    identifier: "view",
                    isRequired: false,
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The name or ID of a view in the tableName. If set, only the records in that view will be returned. type: String",
                    subtitle:
                      "The name or ID of a view in the tableName. Example: GridView",
                    label: "View",
                    configProperty: "actionConfiguration.formData.view",
                  },
                  {
                    identifier: "cellFormat",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The format that should be used for cell values. Supported values are: json and string. The default is json. type: String",
                    subtitle: "Format to used for cell values. Example: json",
                    label: "Cell format",
                    configProperty: "actionConfiguration.formData.cellFormat",
                  },
                  {
                    identifier: "timeZone",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The time zone that should be used to format dates when using string as the cellFormat. This parameter is required when using string as the cellFormat. type: String",
                    subtitle:
                      "time zone that should be used to format dates when using string as the cellFormat",
                    label: "Time zone",
                    configProperty: "actionConfiguration.formData.timeZone",
                  },
                  {
                    identifier: "userLocale",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "The user locale that should be used to format dates when using string as the cellFormat. This parameter is required when using string as the cellFormat. type: String",
                    subtitle:
                      " user locale that should be used to format dates when using string as the cellFormat.",
                    label: "User locale",
                    configProperty: "actionConfiguration.formData.userLocale",
                  },
                  {
                    identifier: "offset",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    tooltipText:
                      "If there are more records, the response will contain an offset.To fetch the next page of records, include offset in the next request's parameters. Pagination will stop when you've reached the end of your table. If the maxRecords parameter is passed, pagination will stop once you've reached this maximum. type: String",
                    subtitle:
                      "Paging cursor token to get the next set of results. Example: itrZ5o03g2WP95ntX/recvKqNLuVajJw9MY.",
                    label: "Offset",
                    configProperty: "actionConfiguration.formData.offset",
                  },
                ],
                name: "List records",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'LIST_RECORDS'}}",
                },
              },
              {
                identifier: "RETRIEVE_A_RECORD",
                controlType: "SECTION",
                children: [
                  {
                    configProperty: "actionConfiguration.formData.baseId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "baseId",
                    isRequired: true,
                    label: "Base ID",
                    tooltipText: "ID of Airtable base. type: String",
                    subtitle: "Airtable ID. Example: appXXXXXXXXX",
                    placeholderText: "appXXXXXXXXX",
                  },
                  {
                    configProperty: "actionConfiguration.formData.tableName",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "tableName",
                    isRequired: true,
                    label: "Table name",
                    requiresEncoding: true,
                    tooltipText: "Name of table in Airtable base. type: String",
                    subtitle: "Table name. Example: Projects",
                    placeholderText: "Table name",
                  },
                  {
                    configProperty: "actionConfiguration.formData.recordId",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    identifier: "recordId",
                    label: "Record ID ",
                    isRequired: true,
                    tooltipText: "Record ID you want to retrieve. type: String",
                    subtitle: "Record ID. Example: recXXXXXXXXXX",
                    placeholderText: "recXXXXXXXXX",
                  },
                ],
                name: "Retrieve a record",
                conditionals: {
                  show: "{{actionConfiguration.formData.command === 'RETRIEVE_A_RECORD'}}",
                },
              },
            ],
          },
          datasourceUiConfig: {
            form: [
              {
                sectionName: "Connection",
                children: [
                  {
                    label: "Authentication type",
                    description: "Select the authentication type to use",
                    configProperty:
                      "datasourceConfiguration.authentication.authenticationType",
                    controlType: "DROP_DOWN",
                    options: [
                      {
                        label: "API key",
                        value: "apiKey",
                      },
                      {
                        label: "Personal access token",
                        value: "bearerToken",
                      },
                    ],
                  },
                  {
                    identifier: "bearerToken",
                    label: "Bearer token",
                    configProperty:
                      "datasourceConfiguration.authentication.bearerToken",
                    controlType: "INPUT_TEXT",
                    dataType: "PASSWORD",
                    encrypted: true,
                    hidden: {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "bearerToken",
                    },
                  },
                  {
                    identifier: "apiKey",
                    label: "Api key",
                    configProperty:
                      "datasourceConfiguration.authentication.value",
                    controlType: "INPUT_TEXT",
                    dataType: "PASSWORD",
                    encrypted: true,
                    hidden: {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "apiKey",
                    },
                  },
                ],
              },
            ],
          },
          templates: {},
          remotePlugin: true,
          new: false,
        },
        {
          id: "654a489144e16d2e57f05d60",
          userPermissions: [],
          name: "Open AI",
          type: "AI",
          packageName: "openai-plugin",
          pluginName: "Open AI",
          iconLocation: "https://assets.appsmith.com/logo/open-ai.svg",
          documentationLink:
            "https://docs.appsmith.com/connect-data/reference/open-ai",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "DbEditorForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "6572a3933efa034a885f73bf",
          userPermissions: [],
          name: "Anthropic",
          type: "AI",
          packageName: "anthropic-plugin",
          pluginName: "Anthropic",
          iconLocation: "https://assets.appsmith.com/logo/anthropic.svg",
          documentationLink:
            "https://docs.appsmith.com/connect-data/reference/anthropic",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "DbEditorForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "6597efc7d0cbfb0c5e0a73cc",
          userPermissions: [],
          name: "Google AI",
          type: "AI",
          packageName: "googleai-plugin",
          pluginName: "Google AI",
          iconLocation: "https://assets.appsmith.com/google-ai.svg",
          documentationLink:
            "https://docs.appsmith.com/connect-data/reference/google-ai",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "DbEditorForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "6597efc7d0cbfb0c5e0a73cd",
          userPermissions: [],
          name: "Databricks",
          type: "DB",
          packageName: "databricks-plugin",
          pluginName: "Databricks",
          iconLocation: "https://assets.appsmith.com/databricks-logo.svg",
          documentationLink:
            "https://docs.appsmith.com/connect-data/reference/databricks",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "DbEditorForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
        {
          id: "6597efc7d0cbfb0c5e0a73ce",
          userPermissions: [],
          name: "AWS Lambda",
          type: "REMOTE",
          packageName: "aws-lambda-plugin",
          pluginName: "AWS Lambda",
          iconLocation: "https://assets.appsmith.com/aws-lambda-logo.svg",
          documentationLink:
            "https://docs.appsmith.com/connect-data/reference/aws-lambda",
          responseType: "JSON",
          uiComponent: "UQIDbEditorForm",
          datasourceComponent: "DbEditorForm",
          allowUserDatasources: true,
          isRemotePlugin: false,
          templates: {},
          remotePlugin: false,
          new: false,
        },
      ],
      defaultPluginList: [
        {
          id: "653236205e9a6424e4c04b51",
          userPermissions: [],
          name: "PostgreSQL",
          packageName: "postgres-plugin",
          iconLocation: "https://assets.appsmith.com/logo/postgresql.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236205e9a6424e4c04b52",
          userPermissions: [],
          name: "REST API",
          packageName: "restapi-plugin",
          iconLocation: "https://assets.appsmith.com/RestAPI.png",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236205e9a6424e4c04b53",
          userPermissions: [],
          name: "MongoDB",
          packageName: "mongo-plugin",
          iconLocation: "https://assets.appsmith.com/logo/mongodb.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b55",
          userPermissions: [],
          name: "MySQL",
          packageName: "mysql-plugin",
          iconLocation: "https://assets.appsmith.com/logo/mysql.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b58",
          userPermissions: [],
          name: "Elasticsearch",
          packageName: "elasticsearch-plugin",
          iconLocation: "https://assets.appsmith.com/logo/elastic.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b59",
          userPermissions: [],
          name: "DynamoDB",
          packageName: "dynamo-plugin",
          iconLocation: "https://assets.appsmith.com/logo/aws-dynamodb.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5a",
          userPermissions: [],
          name: "Redis",
          packageName: "redis-plugin",
          iconLocation: "https://assets.appsmith.com/logo/redis.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5b",
          userPermissions: [],
          name: "Microsoft SQL Server",
          packageName: "mssql-plugin",
          iconLocation: "https://assets.appsmith.com/logo/mssql.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5c",
          userPermissions: [],
          name: "Firestore",
          packageName: "firestore-plugin",
          iconLocation: "https://assets.appsmith.com/logo/firestore.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5d",
          userPermissions: [],
          name: "Redshift",
          packageName: "redshift-plugin",
          iconLocation: "https://assets.appsmith.com/logo/aws-redshift.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5e",
          userPermissions: [],
          name: "S3",
          packageName: "amazons3-plugin",
          iconLocation: "https://assets.appsmith.com/logo/aws-s3.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b5f",
          userPermissions: [],
          name: "Google Sheets",
          packageName: "google-sheets-plugin",
          iconLocation: "https://assets.appsmith.com/GoogleSheets.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b61",
          userPermissions: [],
          name: "Snowflake",
          packageName: "snowflake-plugin",
          iconLocation: "https://assets.appsmith.com/logo/snowflake.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b62",
          userPermissions: [],
          name: "ArangoDB",
          packageName: "arangodb-plugin",
          iconLocation: "https://assets.appsmith.com/logo/arangodb.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b63",
          userPermissions: [],
          name: "JS Functions",
          packageName: "js-plugin",
          iconLocation: "https://assets.appsmith.com/js-yellow.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236215e9a6424e4c04b64",
          userPermissions: [],
          name: "SMTP",
          packageName: "smtp-plugin",
          iconLocation: "https://assets.appsmith.com/smtp-icon.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236225e9a6424e4c04b74",
          userPermissions: [],
          name: "Authenticated GraphQL API",
          packageName: "graphql-plugin",
          iconLocation:
            "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/logo/graphql.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236225e9a6424e4c04b75",
          userPermissions: [],
          name: "Oracle",
          packageName: "oracle-plugin",
          iconLocation:
            "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/oracle.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236465e9a6424e4c04b77",
          userPermissions: [],
          name: "HubSpot",
          packageName: "saas-plugin",
          iconLocation: "https://assets.appsmith.com/integrations/hubspot.png",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236465e9a6424e4c04b78",
          userPermissions: [],
          name: "Twilio",
          packageName: "saas-plugin",
          iconLocation: "https://assets.appsmith.com/integrations/twilio1.png",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "653236465e9a6424e4c04b79",
          userPermissions: [],
          name: "Airtable",
          packageName: "saas-plugin",
          iconLocation: "https://assets.appsmith.com/integrations/airtable.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "654a489144e16d2e57f05d60",
          userPermissions: [],
          name: "Open AI",
          packageName: "openai-plugin",
          iconLocation: "https://assets.appsmith.com/logo/open-ai.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "6572a3933efa034a885f73bf",
          userPermissions: [],
          name: "Anthropic",
          packageName: "anthropic-plugin",
          iconLocation: "https://assets.appsmith.com/logo/anthropic.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "6597efc7d0cbfb0c5e0a73cc",
          userPermissions: [],
          name: "Google AI",
          packageName: "googleai-plugin",
          iconLocation: "https://assets.appsmith.com/google-ai.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "6597efc7d0cbfb0c5e0a73cd",
          userPermissions: [],
          name: "Databricks",
          packageName: "databricks-plugin",
          iconLocation: "https://assets.appsmith.com/databricks-logo.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
        {
          id: "6597efc7d0cbfb0c5e0a73ce",
          userPermissions: [],
          name: "AWS Lambda",
          packageName: "aws-lambda-plugin",
          iconLocation: "https://assets.appsmith.com/aws-lambda-logo.svg",
          allowUserDatasources: true,
          isRemotePlugin: false,
          remotePlugin: false,
          new: false,
        },
      ],
      loading: false,
      formConfigs: {
        "653236205e9a6424e4c04b53": [
          {
            sectionName: "Connection",
            children: [
              {
                label: "Use mongo connection string URI key",
                configProperty: "datasourceConfiguration.properties[0].key",
                controlType: "INPUT_TEXT",
                initialValue: "Use mongo connection string URI",
                hidden: true,
              },
              {
                label: "Use mongo connection string URI",
                configProperty: "datasourceConfiguration.properties[0].value",
                controlType: "DROP_DOWN",
                initialValue: "No",
                options: [
                  {
                    label: "Yes",
                    value: "Yes",
                  },
                  {
                    label: "No",
                    value: "No",
                  },
                ],
              },
              {
                label: "Connection string URI key",
                configProperty: "datasourceConfiguration.properties[1].key",
                controlType: "INPUT_TEXT",
                initialValue: "Connection string URI",
                hidden: true,
              },
              {
                label: "Connection string URI",
                placeholderText:
                  "mongodb+srv://<username>:<password>@test-db.swrsq.mongodb.net/myDatabase",
                configProperty: "datasourceConfiguration.properties[1].value",
                controlType: "INPUT_TEXT",
                hidden: {
                  path: "datasourceConfiguration.properties[0].value",
                  comparison: "NOT_EQUALS",
                  value: "Yes",
                },
              },
              {
                label: "Connection mode",
                configProperty: "datasourceConfiguration.connection.mode",
                controlType: "SEGMENTED_CONTROL",
                initialValue: "READ_WRITE",
                options: [
                  {
                    label: "Read / Write",
                    value: "READ_WRITE",
                  },
                  {
                    label: "Read only",
                    value: "READ_ONLY",
                  },
                ],
                hidden: {
                  path: "datasourceConfiguration.properties[0].value",
                  comparison: "EQUALS",
                  value: "Yes",
                },
              },
              {
                label: "Connection type",
                configProperty: "datasourceConfiguration.connection.type",
                initialValue: "DIRECT",
                controlType: "DROP_DOWN",
                options: [
                  {
                    label: "Direct connection",
                    value: "DIRECT",
                  },
                  {
                    label: "Replica set",
                    value: "REPLICA_SET",
                  },
                ],
                hidden: {
                  path: "datasourceConfiguration.properties[0].value",
                  comparison: "EQUALS",
                  value: "Yes",
                },
              },
              {
                children: [
                  {
                    label: "Host address",
                    configProperty: "datasourceConfiguration.endpoints[*].host",
                    controlType: "KEYVALUE_ARRAY",
                    validationMessage: "Please enter a valid host",
                    validationRegex: "^((?![/:]).)*$",
                    placeholderText: "myapp.abcde.mongodb.net",
                    hidden: {
                      path: "datasourceConfiguration.properties[0].value",
                      comparison: "EQUALS",
                      value: "Yes",
                    },
                  },
                  {
                    label: "Port",
                    configProperty: "datasourceConfiguration.endpoints[*].port",
                    dataType: "NUMBER",
                    controlType: "KEYVALUE_ARRAY",
                    hidden: {
                      path: "datasourceConfiguration.properties[0].value",
                      comparison: "EQUALS",
                      value: "Yes",
                    },
                    placeholderText: "27017",
                  },
                ],
              },
              {
                label: "Default database name",
                placeholderText: "(optional)",
                configProperty:
                  "datasourceConfiguration.connection.defaultDatabaseName",
                controlType: "INPUT_TEXT",
                hidden: {
                  path: "datasourceConfiguration.properties[0].value",
                  comparison: "EQUALS",
                  value: "Yes",
                },
              },
            ],
          },
          {
            sectionName: "Authentication",
            hidden: {
              path: "datasourceConfiguration.properties[0].value",
              comparison: "EQUALS",
              value: "Yes",
            },
            children: [
              {
                label: "Database name",
                configProperty:
                  "datasourceConfiguration.authentication.databaseName",
                controlType: "INPUT_TEXT",
                placeholderText: "Database name",
                initialValue: "admin",
              },
              {
                label: "Authentication type",
                configProperty:
                  "datasourceConfiguration.authentication.authType",
                controlType: "DROP_DOWN",
                initialValue: "SCRAM_SHA_1",
                options: [
                  {
                    label: "SCRAM-SHA-1",
                    value: "SCRAM_SHA_1",
                  },
                  {
                    label: "SCRAM-SHA-256",
                    value: "SCRAM_SHA_256",
                  },
                  {
                    label: "MONGODB-CR",
                    value: "MONGODB_CR",
                  },
                ],
              },
              {
                children: [
                  {
                    label: "Username",
                    configProperty:
                      "datasourceConfiguration.authentication.username",
                    controlType: "INPUT_TEXT",
                    placeholderText: "Username",
                  },
                  {
                    label: "Password",
                    configProperty:
                      "datasourceConfiguration.authentication.password",
                    dataType: "PASSWORD",
                    controlType: "INPUT_TEXT",
                    placeholderText: "Password",
                    encrypted: true,
                  },
                ],
              },
            ],
          },
          {
            sectionName: "SSL (optional)",
            hidden: {
              path: "datasourceConfiguration.properties[0].value",
              comparison: "EQUALS",
              value: "Yes",
            },
            children: [
              {
                label: "SSL mode",
                configProperty:
                  "datasourceConfiguration.connection.ssl.authType",
                controlType: "DROP_DOWN",
                initialValue: "DEFAULT",
                options: [
                  {
                    label: "Default",
                    value: "DEFAULT",
                  },
                  {
                    label: "Enabled",
                    value: "ENABLED",
                  },
                  {
                    label: "Disabled",
                    value: "DISABLED",
                  },
                ],
              },
            ],
          },
        ],
        "653236205e9a6424e4c04b51": [
          {
            sectionName: "Connection",
            id: 1,
            children: [
              {
                label: "Connection mode",
                configProperty: "datasourceConfiguration.connection.mode",
                controlType: "SEGMENTED_CONTROL",
                initialValue: "READ_WRITE",
                options: [
                  {
                    label: "Read / Write",
                    value: "READ_WRITE",
                  },
                  {
                    label: "Read only",
                    value: "READ_ONLY",
                  },
                ],
              },
              {
                children: [
                  {
                    label: "Host address",
                    configProperty: "datasourceConfiguration.endpoints[*].host",
                    controlType: "KEYVALUE_ARRAY",
                    validationMessage: "Please enter a valid host",
                    validationRegex: "^((?![/:]).)*$",
                    placeholderText: "myapp.abcde.postgres.net",
                  },
                  {
                    label: "Port",
                    configProperty: "datasourceConfiguration.endpoints[*].port",
                    dataType: "NUMBER",
                    controlType: "KEYVALUE_ARRAY",
                    placeholderText: "5432",
                  },
                ],
              },
              {
                label: "Database name",
                configProperty:
                  "datasourceConfiguration.authentication.databaseName",
                controlType: "INPUT_TEXT",
                placeholderText: "Database name",
                initialValue: "admin",
              },
            ],
          },
          {
            sectionName: "Authentication",
            id: 2,
            children: [
              {
                children: [
                  {
                    label: "Username",
                    configProperty:
                      "datasourceConfiguration.authentication.username",
                    controlType: "INPUT_TEXT",
                    placeholderText: "Username",
                  },
                  {
                    label: "Password",
                    configProperty:
                      "datasourceConfiguration.authentication.password",
                    dataType: "PASSWORD",
                    controlType: "INPUT_TEXT",
                    placeholderText: "Password",
                    encrypted: true,
                  },
                ],
              },
            ],
          },
          {
            id: 3,
            sectionName: "SSL (optional)",
            children: [
              {
                label: "SSL mode",
                configProperty:
                  "datasourceConfiguration.connection.ssl.authType",
                controlType: "DROP_DOWN",
                initialValue: "DEFAULT",
                options: [
                  {
                    label: "Default",
                    value: "DEFAULT",
                  },
                  {
                    label: "Allow",
                    value: "ALLOW",
                  },
                  {
                    label: "Prefer",
                    value: "PREFER",
                  },
                  {
                    label: "Require",
                    value: "REQUIRE",
                  },
                  {
                    label: "Disable",
                    value: "DISABLE",
                  },
                ],
              },
            ],
          },
        ],
        "653236205e9a6424e4c04b52": [
          {
            sectionName: "General",
            children: [
              {
                label: "URL",
                configProperty: "datasourceConfiguration.url",
                controlType: "INPUT_TEXT",
                isRequired: true,
                placeholderText: "https://example.com",
              },
              {
                label: "Headers",
                configProperty: "datasourceConfiguration.headers",
                controlType: "KEYVALUE_ARRAY",
              },
              {
                label: "Query Params",
                configProperty: "datasourceConfiguration.queryParameters",
                controlType: "KEYVALUE_ARRAY",
              },
              {
                label: "Send authentication Information key (do not edit)",
                configProperty: "datasourceConfiguration.properties[0].key",
                controlType: "INPUT_TEXT",
                hidden: true,
                initialValue: "isSendSessionEnabled",
              },
              {
                label: "Send Appsmith signature header (X-APPSMITH-SIGNATURE)",
                configProperty: "datasourceConfiguration.properties[0].value",
                controlType: "DROP_DOWN",
                isRequired: true,
                initialValue: "N",
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
              {
                label: "Session details signature key key (do not edit)",
                configProperty: "datasourceConfiguration.properties[1].key",
                controlType: "INPUT_TEXT",
                hidden: true,
                initialValue: "sessionSignatureKey",
              },
              {
                label: "Session details signature key",
                configProperty: "datasourceConfiguration.properties[1].value",
                controlType: "INPUT_TEXT",
                hidden: {
                  path: "datasourceConfiguration.properties[0].value",
                  comparison: "EQUALS",
                  value: "N",
                },
              },
              {
                label: "Authentication type",
                configProperty:
                  "datasourceConfiguration.authentication.authenticationType",
                controlType: "DROP_DOWN",
                options: [
                  {
                    label: "None",
                    value: "dbAuth",
                  },
                  {
                    label: "Basic",
                    value: "basic",
                  },
                  {
                    label: "OAuth 2.0",
                    value: "oAuth2",
                  },
                  {
                    label: "API key",
                    value: "apiKey",
                  },
                  {
                    label: "Bearer token",
                    value: "bearerToken",
                  },
                ],
              },
              {
                label: "Grant type",
                configProperty:
                  "datasourceConfiguration.authentication.grantType",
                controlType: "INPUT_TEXT",
                isRequired: false,
                hidden: true,
              },
              {
                label: "Access token URL",
                configProperty:
                  "datasourceConfiguration.authentication.accessTokenUrl",
                controlType: "INPUT_TEXT",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Client Id",
                configProperty:
                  "datasourceConfiguration.authentication.clientId",
                controlType: "INPUT_TEXT",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Client secret",
                configProperty:
                  "datasourceConfiguration.authentication.clientSecret",
                dataType: "PASSWORD",
                controlType: "INPUT_TEXT",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Scope(s)",
                configProperty:
                  "datasourceConfiguration.authentication.scopeString",
                controlType: "INPUT_TEXT",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Header prefix",
                configProperty:
                  "datasourceConfiguration.authentication.headerPrefix",
                controlType: "INPUT_TEXT",
                placeholderText: "Bearer (default)",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Add token to",
                configProperty:
                  "datasourceConfiguration.authentication.isTokenHeader",
                controlType: "DROP_DOWN",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                options: [
                  {
                    label: "Header",
                    value: true,
                  },
                  {
                    label: "Query parameters",
                    value: false,
                  },
                ],
              },
              {
                label: "Audience(s)",
                configProperty:
                  "datasourceConfiguration.authentication.audience",
                controlType: "INPUT_TEXT",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Resource(s)",
                configProperty:
                  "datasourceConfiguration.authentication.resource",
                controlType: "INPUT_TEXT",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Send scope with refresh token",
                configProperty:
                  "datasourceConfiguration.authentication.sendScopeWithRefreshToken",
                controlType: "DROP_DOWN",
                isRequired: true,
                initialValue: false,
                options: [
                  {
                    label: "Yes",
                    value: true,
                  },
                  {
                    label: "No",
                    value: false,
                  },
                ],
              },
              {
                label: "Send client credentials with (on refresh token)",
                configProperty:
                  "datasourceConfiguration.authentication.refreshTokenClientCredentialsLocation",
                controlType: "DROP_DOWN",
                isRequired: true,
                initialValue: "BODY",
                options: [
                  {
                    label: "Body",
                    value: "BODY",
                  },
                  {
                    label: "Header",
                    value: "HEADER",
                  },
                ],
              },
            ],
          },
        ],
        "653236225e9a6424e4c04b74": [
          {
            sectionName: "General",
            children: [
              {
                label: "URL",
                configProperty: "datasourceConfiguration.url",
                controlType: "INPUT_TEXT",
                isRequired: true,
                placeholderText: "https://example.com",
              },
              {
                label: "Headers",
                configProperty: "datasourceConfiguration.headers",
                controlType: "KEYVALUE_ARRAY",
              },
              {
                label: "Query Params",
                configProperty: "datasourceConfiguration.queryParameters",
                controlType: "KEYVALUE_ARRAY",
              },
              {
                label: "Send authentication Information key (do not edit)",
                configProperty: "datasourceConfiguration.properties[0].key",
                controlType: "INPUT_TEXT",
                hidden: true,
                initialValue: "isSendSessionEnabled",
              },
              {
                label: "Send Appsmith signature header",
                subtitle: "Header key: X-APPSMITH-SIGNATURE",
                configProperty: "datasourceConfiguration.properties[0].value",
                controlType: "DROP_DOWN",
                isRequired: true,
                initialValue: "N",
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
              {
                label: "Session details signature key key (do not edit)",
                configProperty: "datasourceConfiguration.properties[1].key",
                controlType: "INPUT_TEXT",
                hidden: true,
                initialValue: "sessionSignatureKey",
              },
              {
                label: "Session details signature key",
                configProperty: "datasourceConfiguration.properties[1].value",
                controlType: "INPUT_TEXT",
                hidden: {
                  path: "datasourceConfiguration.properties[0].value",
                  comparison: "EQUALS",
                  value: "N",
                },
              },
            ],
          },
          {
            sectionName: "Authentication",
            children: [
              {
                label: "Authentication type",
                configProperty:
                  "datasourceConfiguration.authentication.authenticationType",
                controlType: "DROP_DOWN",
                options: [
                  {
                    label: "None",
                    value: "dbAuth",
                  },
                  {
                    label: "Basic",
                    value: "basic",
                  },
                  {
                    label: "OAuth 2.0",
                    value: "oAuth2",
                  },
                  {
                    label: "API key",
                    value: "apiKey",
                  },
                  {
                    label: "Bearer token",
                    value: "bearerToken",
                  },
                ],
              },
              {
                label: "Username",
                configProperty:
                  "datasourceConfiguration.authentication.username",
                controlType: "INPUT_TEXT",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "basic",
                },
              },
              {
                label: "Password",
                configProperty:
                  "datasourceConfiguration.authentication.password",
                dataType: "PASSWORD",
                controlType: "INPUT_TEXT",
                isRequired: false,
                encrypted: true,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "basic",
                },
              },
              {
                label: "Grant type",
                configProperty:
                  "datasourceConfiguration.authentication.grantType",
                controlType: "DROP_DOWN",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                initialValue: "authorization_code",
                options: [
                  {
                    label: "Client Credentials",
                    value: "client_credentials",
                  },
                  {
                    label: "Authorization Code",
                    value: "authorization_code",
                  },
                ],
              },
              {
                label: "Add token to",
                configProperty:
                  "datasourceConfiguration.authentication.isTokenHeader",
                controlType: "DROP_DOWN",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
                initialValue: true,
                options: [
                  {
                    label: "Request Header",
                    value: true,
                  },
                  {
                    label: "Request URL",
                    value: false,
                  },
                ],
              },
              {
                label: "Header prefix",
                configProperty:
                  "datasourceConfiguration.authentication.headerPrefix",
                controlType: "INPUT_TEXT",
                placeholderText: "eg: Bearer ",
                initialValue: "Bearer",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Access token URL",
                configProperty:
                  "datasourceConfiguration.authentication.accessTokenUrl",
                controlType: "INPUT_TEXT",
                placeholderText: "https://example.com/login/oauth/access_token",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Client ID",
                configProperty:
                  "datasourceConfiguration.authentication.clientId",
                controlType: "INPUT_TEXT",
                placeholderText: "Client ID",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Client secret",
                configProperty:
                  "datasourceConfiguration.authentication.clientSecret",
                dataType: "PASSWORD",
                placeholderText: "Client secret",
                controlType: "INPUT_TEXT",
                isRequired: false,
                encrypted: true,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Scope(s)",
                configProperty:
                  "datasourceConfiguration.authentication.scopeString",
                controlType: "INPUT_TEXT",
                placeholderText: "e.g. read, write",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "oAuth2",
                },
              },
              {
                label: "Authorization URL",
                configProperty:
                  "datasourceConfiguration.authentication.authorizationUrl",
                controlType: "INPUT_TEXT",
                placeholderText: "https://example.com/login/oauth/authorize",
                isRequired: false,
                hidden: {
                  conditionType: "OR",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "oAuth2",
                    },
                    {
                      path: "datasourceConfiguration.authentication.grantType",
                      comparison: "NOT_EQUALS",
                      value: "authorization_code",
                    },
                  ],
                },
              },
              {
                label: "Redirect URL",
                subtitle: "Url that the oauth server should redirect to",
                configProperty:
                  "datasourceConfiguration.authentication.redirectURL",
                controlType: "FIXED_KEY_INPUT",
                disabled: true,
                placeholderText: "Redirect URL",
                isRequired: false,
                initialValue:
                  "{{window.location.origin + '/api/v1/datasources/authorize'}}",
                hidden: {
                  conditionType: "OR",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "oAuth2",
                    },
                    {
                      path: "datasourceConfiguration.authentication.grantType",
                      comparison: "NOT_EQUALS",
                      value: "authorization_code",
                    },
                  ],
                },
              },
              {
                label: "Custom Authentication Parameters",
                configProperty:
                  "datasourceConfiguration.authentication.customAuthenticationParameters",
                controlType: "KEYVALUE_ARRAY",
                isRequired: false,
                hidden: {
                  conditionType: "OR",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "oAuth2",
                    },
                    {
                      path: "datasourceConfiguration.authentication.grantType",
                      comparison: "NOT_EQUALS",
                      value: "authorization_code",
                    },
                  ],
                },
              },
              {
                label: "Client Authentication",
                configProperty:
                  "datasourceConfiguration.authentication.isAuthorizationHeader",
                controlType: "DROP_DOWN",
                isRequired: false,
                hidden: {
                  conditionType: "OR",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "oAuth2",
                    },
                    {
                      path: "datasourceConfiguration.authentication.grantType",
                      comparison: "NOT_EQUALS",
                      value: "authorization_code",
                    },
                  ],
                },
                initialValue: true,
                options: [
                  {
                    label: "Send as Basic Auth header",
                    value: true,
                  },
                  {
                    label: "Send client credentials in body",
                    value: false,
                  },
                ],
              },
              {
                label: "Audience(s)",
                configProperty:
                  "datasourceConfiguration.authentication.audience",
                controlType: "INPUT_TEXT",
                placeholderText: "https://example.com/oauth/audience",
                isRequired: false,
                hidden: {
                  conditionType: "OR",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "oAuth2",
                    },
                    {
                      conditionType: "AND",
                      conditions: [
                        {
                          path: "datasourceConfiguration.authentication.authenticationType",
                          comparison: "EQUALS",
                          value: "oAuth2",
                        },
                        {
                          path: "datasourceConfiguration.authentication.grantType",
                          comparison: "EQUALS",
                          value: "authorization_code",
                        },
                        {
                          path: "datasourceConfiguration.authentication.isAuthorizationHeader",
                          comparison: "EQUALS",
                          value: true,
                        },
                      ],
                    },
                  ],
                },
              },
              {
                label: "Resource(s)",
                configProperty:
                  "datasourceConfiguration.authentication.resource",
                controlType: "INPUT_TEXT",
                placeholderText: "https://example.com/oauth/resource",
                isRequired: false,
                hidden: {
                  conditionType: "OR",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "oAuth2",
                    },
                    {
                      conditionType: "AND",
                      conditions: [
                        {
                          path: "datasourceConfiguration.authentication.authenticationType",
                          comparison: "EQUALS",
                          value: "oAuth2",
                        },
                        {
                          path: "datasourceConfiguration.authentication.grantType",
                          comparison: "EQUALS",
                          value: "authorization_code",
                        },
                        {
                          path: "datasourceConfiguration.authentication.isAuthorizationHeader",
                          comparison: "EQUALS",
                          value: true,
                        },
                      ],
                    },
                  ],
                },
              },
              {
                label: "Send scope with refresh token",
                configProperty:
                  "datasourceConfiguration.authentication.sendScopeWithRefreshToken",
                controlType: "DROP_DOWN",
                isRequired: false,
                initialValue: false,
                options: [
                  {
                    label: "Yes",
                    value: true,
                  },
                  {
                    label: "No",
                    value: false,
                  },
                ],
                hidden: {
                  conditionType: "OR",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "oAuth2",
                    },
                    {
                      path: "datasourceConfiguration.authentication.grantType",
                      comparison: "NOT_EQUALS",
                      value: "authorization_code",
                    },
                  ],
                },
              },
              {
                label: "Send client credentials with (on refresh token)",
                configProperty:
                  "datasourceConfiguration.authentication.refreshTokenClientCredentialsLocation",
                controlType: "DROP_DOWN",
                isRequired: false,
                initialValue: "BODY",
                options: [
                  {
                    label: "Body",
                    value: "BODY",
                  },
                  {
                    label: "Header",
                    value: "HEADER",
                  },
                ],
                hidden: {
                  conditionType: "OR",
                  conditions: [
                    {
                      path: "datasourceConfiguration.authentication.authenticationType",
                      comparison: "NOT_EQUALS",
                      value: "oAuth2",
                    },
                    {
                      path: "datasourceConfiguration.authentication.grantType",
                      comparison: "NOT_EQUALS",
                      value: "authorization_code",
                    },
                  ],
                },
              },
              {
                label: "Key",
                configProperty: "datasourceConfiguration.authentication.label",
                controlType: "INPUT_TEXT",
                placeholderText: "api_key",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "apiKey",
                },
              },
              {
                label: "Value (Encrypted)",
                configProperty: "datasourceConfiguration.authentication.value",
                controlType: "INPUT_TEXT",
                placeholderText: "Value",
                isRequired: false,
                encrypted: true,
                dataType: "PASSWORD",
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "apiKey",
                },
              },
              {
                label: "Add To",
                configProperty: "datasourceConfiguration.authentication.addTo",
                controlType: "DROP_DOWN",
                isRequired: false,
                initialValue: "header",
                options: [
                  {
                    label: "Query Params",
                    value: "queryParams",
                  },
                  {
                    label: "Header",
                    value: "header",
                  },
                ],
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "apiKey",
                },
              },
              {
                label: "Header prefix",
                configProperty:
                  "datasourceConfiguration.authentication.headerPrefix",
                controlType: "INPUT_TEXT",
                placeholderText: "eg: Bearer",
                initialValue: "Bearer",
                isRequired: false,
                hidden: {
                  path: "datasourceConfiguration.authentication.addTo",
                  comparison: "NOT_EQUALS",
                  value: "header",
                },
              },
              {
                label: "Bearer token",
                configProperty:
                  "datasourceConfiguration.authentication.bearerToken",
                controlType: "INPUT_TEXT",
                placeholderText: "Bearer token",
                isRequired: false,
                encrypted: true,
                hidden: {
                  path: "datasourceConfiguration.authentication.authenticationType",
                  comparison: "NOT_EQUALS",
                  value: "bearerToken",
                },
              },
            ],
          },
          {
            sectionName: "Advanced Settings *",
            children: [
              {
                label: "Use Self-signed certificate",
                configProperty:
                  "datasourceConfiguration.connection.ssl.authType",
                controlType: "DROP_DOWN",
                isRequired: true,
                initialValue: "DEFAULT",
                options: [
                  {
                    label: "No",
                    value: "DEFAULT",
                  },
                  {
                    label: "Yes",
                    value: "SELF_SIGNED_CERTIFICATE",
                  },
                ],
              },
              {
                label: "Certificate Details",
                subtitle: "Upload Certificate",
                configProperty:
                  "datasourceConfiguration.connection.ssl.certificateFile",
                controlType: "FILE_PICKER",
                isRequired: false,
                encrypted: true,
                hidden: {
                  path: "datasourceConfiguration.connection.ssl.authType",
                  comparison: "NOT_EQUALS",
                  value: "SELF_SIGNED_CERTIFICATE",
                },
              },
            ],
          },
        ],
        "653236215e9a6424e4c04b63": [],
      },
      editorConfigs: {
        "653236205e9a6424e4c04b53": [
          {
            controlType: "SECTION",
            identifier: "SELECTOR",
            children: [
              {
                label: "Command",
                description:
                  "Choose method you would like to use to query the database",
                configProperty: "actionConfiguration.formData.command.data",
                controlType: "DROP_DOWN",
                initialValue: "FIND",
                options: [
                  {
                    label: "Find document(s)",
                    value: "FIND",
                  },
                  {
                    label: "Insert document(s)",
                    value: "INSERT",
                  },
                  {
                    label: "Update document(s)",
                    value: "UPDATE",
                  },
                  {
                    label: "Delete document(s)",
                    value: "DELETE",
                  },
                  {
                    label: "Count",
                    value: "COUNT",
                  },
                  {
                    label: "Distinct",
                    value: "DISTINCT",
                  },
                  {
                    label: "Aggregate",
                    value: "AGGREGATE",
                  },
                  {
                    label: "Raw",
                    value: "RAW",
                  },
                ],
              },
            ],
          },
          {
            controlType: "SECTION",
            _comment: "This section holds all the templates",
            children: [
              {
                identifier: "AGGREGATE",
                controlType: "SECTION",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'AGGREGATE'}}",
                },
                children: [
                  {
                    controlType: "SECTION",
                    label: "Select collection to query",
                    children: [
                      {
                        label: "Collection",
                        configProperty:
                          "actionConfiguration.formData.collection.data",
                        controlType: "DROP_DOWN",
                        evaluationSubstitutionType: "TEMPLATE",
                        propertyName: "get_collections",
                        fetchOptionsConditionally: true,
                        alternateViewTypes: ["json"],
                        conditionals: {
                          fetchDynamicValues: {
                            condition: "{{true}}",
                            config: {
                              params: {
                                requestType: "_GET_STRUCTURE",
                                displayType: "DROP_DOWN",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    controlType: "SECTION",
                    label: "Query",
                    description: "Optional",
                    children: [
                      {
                        label: "Array of pipelines",
                        configProperty:
                          "actionConfiguration.formData.aggregate.arrayPipelines.data",
                        controlType: "QUERY_DYNAMIC_TEXT",
                        inputType: "JSON",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText:
                          '[{ $project: { tags: 1 } }, { $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum : 1 } } }  ]',
                      },
                    ],
                  },
                  {
                    label: "Limit",
                    configProperty:
                      "actionConfiguration.formData.aggregate.limit.data",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    evaluationSubstitutionType: "TEMPLATE",
                    initialValue: "10",
                  },
                ],
              },
              {
                identifier: "COUNT",
                controlType: "SECTION",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'COUNT'}}",
                },
                children: [
                  {
                    controlType: "SECTION",
                    label: "Select collection to query",
                    children: [
                      {
                        label: "Collection",
                        configProperty:
                          "actionConfiguration.formData.collection.data",
                        controlType: "DROP_DOWN",
                        evaluationSubstitutionType: "TEMPLATE",
                        propertyName: "get_collections",
                        fetchOptionsConditionally: true,
                        alternateViewTypes: ["json"],
                        conditionals: {
                          fetchDynamicValues: {
                            condition: "{{true}}",
                            config: {
                              params: {
                                requestType: "_GET_STRUCTURE",
                                displayType: "DROP_DOWN",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    controlType: "SECTION",
                    label: "Query",
                    description: "Optional",
                    children: [
                      {
                        label: "Query",
                        configProperty:
                          "actionConfiguration.formData.count.query.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        inputType: "JSON",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "{rating : {$gte : 9}}",
                      },
                    ],
                  },
                ],
              },
              {
                identifier: "DELETE",
                controlType: "SECTION",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'DELETE'}}",
                },
                children: [
                  {
                    controlType: "SECTION",
                    label: "Select collection to query",
                    children: [
                      {
                        label: "Collection",
                        configProperty:
                          "actionConfiguration.formData.collection.data",
                        controlType: "DROP_DOWN",
                        evaluationSubstitutionType: "TEMPLATE",
                        propertyName: "get_collections",
                        fetchOptionsConditionally: true,
                        alternateViewTypes: ["json"],
                        conditionals: {
                          fetchDynamicValues: {
                            condition: "{{true}}",
                            config: {
                              params: {
                                requestType: "_GET_STRUCTURE",
                                displayType: "DROP_DOWN",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    controlType: "SECTION",
                    label: "Query",
                    description: "Optional",
                    children: [
                      {
                        label: "Query",
                        configProperty:
                          "actionConfiguration.formData.delete.query.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        inputType: "JSON",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "{rating : {$gte : 9}}",
                      },
                      {
                        label: "Limit",
                        configProperty:
                          "actionConfiguration.formData.delete.limit.data",
                        controlType: "DROP_DOWN",
                        "-subtitle": "Allowed values: SINGLE, ALL",
                        "-tooltipText": "Allowed values: SINGLE, ALL",
                        "-alternateViewTypes": ["json"],
                        initialValue: "SINGLE",
                        options: [
                          {
                            label: "Single document",
                            value: "SINGLE",
                          },
                          {
                            label: "All matching documents",
                            value: "ALL",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                identifier: "DISTINCT",
                controlType: "SECTION",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'DISTINCT'}}",
                },
                children: [
                  {
                    controlType: "SECTION",
                    label: "Select collection to query",
                    children: [
                      {
                        label: "Collection",
                        configProperty:
                          "actionConfiguration.formData.collection.data",
                        controlType: "DROP_DOWN",
                        evaluationSubstitutionType: "TEMPLATE",
                        propertyName: "get_collections",
                        fetchOptionsConditionally: true,
                        alternateViewTypes: ["json"],
                        conditionals: {
                          fetchDynamicValues: {
                            condition: "{{true}}",
                            config: {
                              params: {
                                requestType: "_GET_STRUCTURE",
                                displayType: "DROP_DOWN",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    controlType: "SECTION",
                    label: "Query",
                    description: "Optional",
                    children: [
                      {
                        label: "Query",
                        configProperty:
                          "actionConfiguration.formData.distinct.query.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        inputType: "JSON",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "{rating : {$gte : 9}}",
                      },
                      {
                        label: "Key",
                        configProperty:
                          "actionConfiguration.formData.distinct.key.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "name",
                      },
                    ],
                  },
                ],
              },
              {
                identifier: "FIND",
                controlType: "SECTION",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'FIND'}}",
                },
                children: [
                  {
                    controlType: "SECTION",
                    label: "Select collection to query",
                    children: [
                      {
                        label: "Collection",
                        configProperty:
                          "actionConfiguration.formData.collection.data",
                        controlType: "DROP_DOWN",
                        evaluationSubstitutionType: "TEMPLATE",
                        propertyName: "get_collections",
                        fetchOptionsConditionally: true,
                        alternateViewTypes: ["json"],
                        conditionals: {
                          fetchDynamicValues: {
                            condition: "{{true}}",
                            config: {
                              params: {
                                requestType: "_GET_STRUCTURE",
                                displayType: "DROP_DOWN",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    controlType: "SECTION",
                    label: "Query",
                    description: "Optional",
                    children: [
                      {
                        label: "Query",
                        configProperty:
                          "actionConfiguration.formData.find.query.data",
                        controlType: "QUERY_DYNAMIC_TEXT",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "{rating : {$gte : 9}}",
                      },
                      {
                        label: "Sort",
                        configProperty:
                          "actionConfiguration.formData.find.sort.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        inputType: "JSON",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "{name : 1}",
                      },
                      {
                        label: "Projection",
                        configProperty:
                          "actionConfiguration.formData.find.projection.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        inputType: "JSON",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "{name : 1}",
                      },
                      {
                        label: "Limit",
                        configProperty:
                          "actionConfiguration.formData.find.limit.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "10",
                      },
                      {
                        label: "Skip",
                        configProperty:
                          "actionConfiguration.formData.find.skip.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "0",
                      },
                    ],
                  },
                ],
              },
              {
                identifier: "INSERT",
                controlType: "SECTION",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'INSERT'}}",
                },
                children: [
                  {
                    controlType: "SECTION",
                    label: "Select collection to query",
                    children: [
                      {
                        label: "Collection",
                        configProperty:
                          "actionConfiguration.formData.collection.data",
                        controlType: "DROP_DOWN",
                        evaluationSubstitutionType: "TEMPLATE",
                        propertyName: "get_collections",
                        fetchOptionsConditionally: true,
                        alternateViewTypes: ["json"],
                        conditionals: {
                          fetchDynamicValues: {
                            condition: "{{true}}",
                            config: {
                              params: {
                                requestType: "_GET_STRUCTURE",
                                displayType: "DROP_DOWN",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    controlType: "SECTION",
                    label: "Query",
                    description: "Optional",
                    children: [
                      {
                        label: "Documents",
                        configProperty:
                          "actionConfiguration.formData.insert.documents.data",
                        controlType: "QUERY_DYNAMIC_TEXT",
                        inputType: "JSON",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText:
                          '[ { _id: 1, user: "abc123", status: "A" } ]',
                      },
                    ],
                  },
                ],
              },
              {
                identifier: "UPDATE",
                controlType: "SECTION",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'UPDATE'}}",
                },
                children: [
                  {
                    controlType: "SECTION",
                    label: "Select collection to query",
                    children: [
                      {
                        label: "Collection",
                        configProperty:
                          "actionConfiguration.formData.collection.data",
                        controlType: "DROP_DOWN",
                        evaluationSubstitutionType: "TEMPLATE",
                        propertyName: "get_collections",
                        fetchOptionsConditionally: true,
                        alternateViewTypes: ["json"],
                        conditionals: {
                          fetchDynamicValues: {
                            condition: "{{true}}",
                            config: {
                              params: {
                                requestType: "_GET_STRUCTURE",
                                displayType: "DROP_DOWN",
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                  {
                    controlType: "SECTION",
                    label: "Query",
                    description: "Optional",
                    children: [
                      {
                        label: "Query",
                        configProperty:
                          "actionConfiguration.formData.updateMany.query.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        inputType: "JSON",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "{rating : {$gte : 9}}",
                      },
                      {
                        label: "Update",
                        configProperty:
                          "actionConfiguration.formData.updateMany.update.data",
                        controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                        inputType: "JSON",
                        evaluationSubstitutionType: "TEMPLATE",
                        placeholderText: "{ $inc: { score: 1 } }",
                      },
                      {
                        label: "Limit",
                        configProperty:
                          "actionConfiguration.formData.updateMany.limit.data",
                        controlType: "DROP_DOWN",
                        "-subtitle": "Allowed values: SINGLE, ALL",
                        "-tooltipText": "Allowed values: SINGLE, ALL",
                        "-alternateViewTypes": ["json"],
                        initialValue: "SINGLE",
                        options: [
                          {
                            label: "Single document",
                            value: "SINGLE",
                          },
                          {
                            label: "All matching documents",
                            value: "ALL",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                identifier: "RAW",
                controlType: "SECTION",
                conditionals: {
                  show: "{{actionConfiguration.formData.command.data === 'RAW'}}",
                },
                children: [
                  {
                    controlType: "SECTION",
                    label: "Query",
                    description: "Optional",
                    children: [
                      {
                        label: "",
                        propertyName: "rawWithSmartSubstitute",
                        configProperty:
                          "actionConfiguration.formData.body.data",
                        controlType: "QUERY_DYNAMIC_TEXT",
                        evaluationSubstitutionType: "SMART_SUBSTITUTE",
                        conditionals: {
                          show: "{{actionConfiguration.formData.command.data === 'RAW' && actionConfiguration.formData.smartSubstitution.data === true}}",
                        },
                      },
                      {
                        label: "",
                        configProperty:
                          "actionConfiguration.formData.body.data",
                        propertyName: "rawWithTemplateSubstitute",
                        controlType: "QUERY_DYNAMIC_TEXT",
                        evaluationSubstitutionType: "TEMPLATE",
                        conditionals: {
                          show: "{{actionConfiguration.formData.command.data === 'RAW' && actionConfiguration.formData.smartSubstitution.data === false}}",
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        "653236205e9a6424e4c04b51": [
          {
            sectionName: "",
            id: 1,
            children: [
              {
                label: "",
                internalLabel: "Query",
                configProperty: "actionConfiguration.body",
                controlType: "QUERY_DYNAMIC_TEXT",
                evaluationSubstitutionType: "PARAMETER",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: false,
                },
              },
              {
                label: "",
                internalLabel: "Query",
                configProperty: "actionConfiguration.body",
                controlType: "QUERY_DYNAMIC_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: true,
                },
              },
              {
                label: "Use prepared statements",
                tooltipText:
                  "Prepared statements prevent SQL injections on your queries but do not support dynamic bindings outside values in your SQL",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[0].value",
                controlType: "SWITCH",
                initialValue: true,
              },
            ],
          },
        ],
        "653236205e9a6424e4c04b52": [
          {
            sectionName: "",
            id: 1,
            children: [
              {
                label: "Path",
                configProperty: "actionConfiguration.path",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
              },
              {
                label: "Body",
                configProperty: "actionConfiguration.body",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "SMART_SUBSTITUTE",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: false,
                },
              },
              {
                label: "Body",
                configProperty: "actionConfiguration.body",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: true,
                },
              },
              {
                label: "Query parameters",
                configProperty: "actionConfiguration.queryParameters",
                controlType: "ARRAY_FIELD",
                schema: [
                  {
                    label: "Key",
                    key: "key",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Key",
                  },
                  {
                    label: "Value",
                    key: "value",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Value",
                  },
                ],
              },
              {
                label: "Headers",
                configProperty: "actionConfiguration.headers",
                controlType: "ARRAY_FIELD",
                schema: [
                  {
                    label: "Key",
                    key: "key",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Key",
                  },
                  {
                    label: "Value",
                    key: "value",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Value",
                  },
                ],
              },
              {
                label: "Form data",
                configProperty: "actionConfiguration.bodyFormData",
                controlType: "ARRAY_FIELD",
                schema: [
                  {
                    label: "Key",
                    key: "key",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Key",
                  },
                  {
                    label: "Value",
                    key: "value",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Value",
                  },
                ],
              },
              {
                label: "Query variables",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[1].value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "SMART_SUBSTITUTE",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: false,
                },
              },
              {
                label: "Query variables",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[1].value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: true,
                },
              },
              {
                label: "Pagination",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[2].value",
                controlType: "E_GRAPHQL_PAGINATION",
                evaluationSubstitutionType: "SMART_SUBSTITUTE",
              },
            ],
          },
        ],
        "653236225e9a6424e4c04b74": [
          {
            sectionName: "",
            id: 1,
            children: [
              {
                label: "Path",
                configProperty: "actionConfiguration.path",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
              },
              {
                label: "Body",
                configProperty: "actionConfiguration.body",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "SMART_SUBSTITUTE",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: false,
                },
              },
              {
                label: "Body",
                configProperty: "actionConfiguration.body",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: true,
                },
              },
              {
                label: "Query parameters",
                configProperty: "actionConfiguration.queryParameters",
                controlType: "ARRAY_FIELD",
                schema: [
                  {
                    label: "Key",
                    key: "key",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Key",
                  },
                  {
                    label: "Value",
                    key: "value",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Value",
                  },
                ],
              },
              {
                label: "Headers",
                configProperty: "actionConfiguration.headers",
                controlType: "ARRAY_FIELD",
                schema: [
                  {
                    label: "Key",
                    key: "key",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Key",
                  },
                  {
                    label: "Value",
                    key: "value",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Value",
                  },
                ],
              },
              {
                label: "Form data",
                configProperty: "actionConfiguration.bodyFormData",
                controlType: "ARRAY_FIELD",
                schema: [
                  {
                    label: "Key",
                    key: "key",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Key",
                  },
                  {
                    label: "Value",
                    key: "value",
                    controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                    placeholderText: "Value",
                  },
                ],
              },
              {
                label: "Query variables",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[1].value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "SMART_SUBSTITUTE",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: false,
                },
              },
              {
                label: "Query variables",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[1].value",
                controlType: "QUERY_DYNAMIC_INPUT_TEXT",
                evaluationSubstitutionType: "TEMPLATE",
                hidden: {
                  path: "actionConfiguration.pluginSpecifiedTemplates[0].value",
                  comparison: "EQUALS",
                  value: true,
                },
              },
              {
                label: "Pagination",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[2].value",
                controlType: "E_GRAPHQL_PAGINATION",
                evaluationSubstitutionType: "SMART_SUBSTITUTE",
              },
            ],
          },
        ],
        "653236215e9a6424e4c04b63": [],
      },
      settingConfigs: {
        "653236205e9a6424e4c04b53": [
          {
            sectionName: "",
            id: 1,
            children: [
              {
                label: "Run behavior",
                configProperty: "runBehavior",
                controlType: "DROP_DOWN",
                initialValue: "MANUAL",
                options: [
                  {
                    label: "On page load",
                    subText:
                      "Query runs when the page loads or when manually triggered",
                    value: "PAGE_LOAD",
                  },
                  {
                    label: "Manual",
                    subText:
                      "Query only runs when called in an event or JS with .run()",
                    value: "MANUAL",
                  },
                ],
              },
              {
                label: "Request confirmation before running this query",
                configProperty: "confirmBeforeExecute",
                controlType: "SWITCH",
                tooltipText:
                  "Ask confirmation from the user each time before refreshing data",
              },
              {
                label: "Smart BSON substitution",
                tooltipText:
                  "Turning on this property fixes the BSON substitution of bindings in the Mongo BSON document by adding/removing quotes intelligently and reduces developer errors",
                configProperty:
                  "actionConfiguration.formData.smartSubstitution.data",
                controlType: "SWITCH",
                initialValue: true,
              },
              {
                label: "Query timeout (in milliseconds)",
                subtitle: "Maximum time after which the query will return",
                configProperty: "actionConfiguration.timeoutInMillisecond",
                controlType: "INPUT_TEXT",
                dataType: "NUMBER",
              },
            ],
          },
        ],
        "653236205e9a6424e4c04b51": [
          {
            sectionName: "",
            id: 1,
            children: [
              {
                label: "Run behavior",
                configProperty: "runBehavior",
                controlType: "DROP_DOWN",
                initialValue: "MANUAL",
                options: [
                  {
                    label: "On page load",
                    subText:
                      "Query runs when the page loads or when manually triggered",
                    value: "PAGE_LOAD",
                  },
                  {
                    label: "Manual",
                    subText:
                      "Query only runs when called in an event or JS with .run()",
                    value: "MANUAL",
                  },
                ],
              },
              {
                label: "Request confirmation before running this query",
                configProperty: "confirmBeforeExecute",
                controlType: "SWITCH",
                tooltipText:
                  "Ask confirmation from the user each time before refreshing data",
              },
              {
                label: "Use prepared statements",
                tooltipText:
                  "Prepared statements prevent SQL injections on your queries but do not support dynamic bindings outside values in your SQL",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[0].value",
                controlType: "SWITCH",
                initialValue: true,
              },
              {
                label: "Query timeout (in milliseconds)",
                subtitle: "Maximum time after which the query will return",
                configProperty: "actionConfiguration.timeoutInMillisecond",
                controlType: "INPUT_TEXT",
                dataType: "NUMBER",
              },
            ],
          },
        ],
        "653236205e9a6424e4c04b52": [
          {
            sectionName: "",
            id: 1,
            children: [
              {
                label: "Run behavior",
                configProperty: "runBehavior",
                controlType: "DROP_DOWN",
                initialValue: "MANUAL",
                options: [
                  {
                    label: "On page load",
                    subText:
                      "Query runs when the page loads or when manually triggered",
                    value: "PAGE_LOAD",
                  },
                  {
                    label: "Manual",
                    subText:
                      "Query only runs when called in an event or JS with .run()",
                    value: "MANUAL",
                  },
                ],
              },
              {
                label: "Request confirmation before running this API",
                configProperty: "confirmBeforeExecute",
                controlType: "SWITCH",
                tooltipText:
                  "Ask confirmation from the user each time before refreshing data",
              },
              {
                label: "Encode query params",
                configProperty: "actionConfiguration.encodeParamsToggle",
                controlType: "SWITCH",
                tooltipText:
                  "Encode query params for all APIs. Also encode form body when Content-Type header is set to x-www-form-encoded",
              },
              {
                label: "Smart JSON substitution",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[0].value",
                controlType: "SWITCH",
                tooltipText:
                  "Turning on this property fixes the JSON substitution of bindings in API body by adding/removing quotes intelligently and reduces developer errors",
                initialValue: true,
              },
              {
                label: "Protocol",
                configProperty: "actionConfiguration.httpVersion",
                name: "actionConfiguration.httpVersion",
                controlType: "DROP_DOWN",
                initialValue: "HTTP/1.1",
                options: [
                  {
                    label: "HTTP/1.1",
                    value: "HTTP11",
                  },
                  {
                    label: "HTTP/2",
                    value: "H2",
                  },
                  {
                    label: "H2C",
                    value: "H2C",
                  },
                ],
                placeholder: "Select HTTP Protocol",
              },
              {
                label: "API timeout (in milliseconds)",
                subtitle: "Maximum time after which the API will return",
                controlType: "INPUT_TEXT",
                configProperty: "actionConfiguration.timeoutInMillisecond",
                dataType: "NUMBER",
              },
            ],
          },
        ],
        "653236225e9a6424e4c04b74": [
          {
            sectionName: "",
            id: 1,
            children: [
              {
                label: "Run behavior",
                configProperty: "runBehavior",
                controlType: "DROP_DOWN",
                initialValue: "MANUAL",
                options: [
                  {
                    label: "On page load",
                    subText:
                      "Query runs when the page loads or when manually triggered",
                    value: "PAGE_LOAD",
                  },
                  {
                    label: "Manual",
                    subText:
                      "Query only runs when called in an event or JS with .run()",
                    value: "MANUAL",
                  },
                ],
              },
              {
                label: "Request confirmation before running this API",
                configProperty: "confirmBeforeExecute",
                controlType: "SWITCH",
                tooltipText:
                  "Ask confirmation from the user each time before refreshing data",
              },
              {
                label: "Encode query params",
                configProperty: "actionConfiguration.encodeParamsToggle",
                controlType: "SWITCH",
                tooltipText:
                  "Encode query params for all APIs. Also encode form body when Content-Type header is set to x-www-form-encoded",
              },
              {
                label: "Smart JSON substitution",
                configProperty:
                  "actionConfiguration.pluginSpecifiedTemplates[0].value",
                controlType: "SWITCH",
                tooltipText:
                  "Turning on this property fixes the JSON substitution of bindings in API body by adding/removing quotes intelligently and reduces developer errors",
                initialValue: true,
              },
              {
                label: "Protocol",
                configProperty: "actionConfiguration.httpVersion",
                name: "actionConfiguration.httpVersion",
                controlType: "DROP_DOWN",
                initialValue: "HTTP/1.1",
                options: [
                  {
                    label: "HTTP/1.1",
                    value: "HTTP11",
                  },
                  {
                    label: "HTTP/2",
                    value: "H2",
                  },
                  {
                    label: "H2C",
                    value: "H2C",
                  },
                ],
                placeholder: "Select HTTP Protocol",
              },
              {
                label: "API timeout (in milliseconds)",
                subtitle: "Maximum time after which the API will return",
                controlType: "INPUT_TEXT",
                configProperty: "actionConfiguration.timeoutInMillisecond",
                dataType: "NUMBER",
              },
            ],
          },
        ],
        "653236215e9a6424e4c04b63": [],
      },
      datasourceFormButtonConfigs: {
        "653236205e9a6424e4c04b53": ["TEST", "CANCEL", "SAVE"],
        "653236205e9a6424e4c04b51": ["TEST", "CANCEL", "SAVE"],
        "653236205e9a6424e4c04b52": ["CANCEL", "SAVE"],
        "653236225e9a6424e4c04b74": ["CANCEL", "SAVE"],
      },
      dependencies: {
        "653236205e9a6424e4c04b53": {
          "actionConfiguration.formData.body.data": [
            "actionConfiguration.formData.smartSubstitution.data",
          ],
        },
        "653236205e9a6424e4c04b51": {
          "actionConfiguration.body": [
            "actionConfiguration.pluginSpecifiedTemplates[0].value",
          ],
        },
        "653236205e9a6424e4c04b52": {
          "actionConfiguration.body": [
            "actionConfiguration.pluginSpecifiedTemplates[0].value",
          ],
        },
        "653236225e9a6424e4c04b74": {
          "actionConfiguration.body": [
            "actionConfiguration.pluginSpecifiedTemplates[0].value",
          ],
        },
        "653236215e9a6424e4c04b63": {},
      },
      fetchingSinglePluginForm: {},
      fetchingDefaultPlugins: false,
    },
    meta: {},
    app: {
      user: {
        email: "jacques@adasdsad.com",
        username: "jacques@adasdsad.com",
        useCase: "personal project",
        enableTelemetry: true,
        roles: [
          "Upgrade to business plan to access roles and groups for conditional business logic",
        ],
        groups: [
          "Upgrade to business plan to access roles and groups for conditional business logic",
        ],
        emptyInstance: false,
        accountNonExpired: true,
        accountNonLocked: true,
        credentialsNonExpired: true,
        isAnonymous: false,
        isEnabled: true,
        isSuperUser: false,
        isConfigurable: true,
        adminSettingsVisible: false,
        isIntercomConsentGiven: false,
      },
      URL: {
        fullPath:
          "https://dev.appsmith.com/app/view-data/home-659f81c8d0cbfb0c5e0a743b/edit",
        host: "dev.appsmith.com",
        hostname: "dev.appsmith.com",
        queryParams: {},
        protocol: "https:",
        pathname: "/app/view-data/home-659f81c8d0cbfb0c5e0a743b/edit",
        port: "",
        hash: "",
      },
      store: {},
      geolocation: {
        canBeRequested: true,
        currentPosition: {},
      },
      mode: "EDIT",
    },
    jsActions: [
      {
        isLoading: false,
        config: {
          id: "659f88f3d0cbfb0c5e0a744c",
          applicationId: "659f81c8d0cbfb0c5e0a7439",
          workspaceId: "659d2e14d0cbfb0c5e0a7424",
          name: "JSObject1",
          pageId: "659f81c8d0cbfb0c5e0a743b",
          pluginId: "653236215e9a6424e4c04b63",
          pluginType: "JS",
          actionIds: [],
          archivedActionIds: [],
          actions: [
            {
              id: "659f88f3d0cbfb0c5e0a744a",
              applicationId: "659f81c8d0cbfb0c5e0a7439",
              workspaceId: "659d2e14d0cbfb0c5e0a7424",
              pluginType: "JS",
              pluginId: "653236215e9a6424e4c04b63",
              name: "myFun1",
              fullyQualifiedName: "JSObject1.myFun1",
              datasource: {
                userPermissions: [],
                name: "UNUSED_DATASOURCE",
                pluginId: "653236215e9a6424e4c04b63",
                workspaceId: "659d2e14d0cbfb0c5e0a7424",
                datasourceStorages: {},
                messages: [],
                isValid: true,
                new: true,
              },
              pageId: "659f81c8d0cbfb0c5e0a743b",
              collectionId: "659f88f3d0cbfb0c5e0a744c",
              actionConfiguration: {
                timeoutInMillisecond: 10000,
                paginationType: "NONE",
                encodeParamsToggle: true,
                body: "function () {}",
                selfReferencingDataPaths: [],
                jsArguments: [],
              },
              executeOnLoad: false,
              runBehavior: "MANUAL",
              clientSideExecution: true,
              dynamicBindingPathList: [
                {
                  key: "body",
                },
              ],
              isValid: true,
              invalids: [],
              messages: [],
              jsonPathKeys: ["function () {}"],
              confirmBeforeExecute: false,
              userPermissions: [
                "read:actions",
                "delete:actions",
                "execute:actions",
                "manage:actions",
              ],
              validName: "JSObject1.myFun1",
              entityReferenceType: "JSACTION",
              selfReferencingDataPaths: [],
            },
            {
              id: "659f88f3d0cbfb0c5e0a7449",
              applicationId: "659f81c8d0cbfb0c5e0a7439",
              workspaceId: "659d2e14d0cbfb0c5e0a7424",
              pluginType: "JS",
              pluginId: "653236215e9a6424e4c04b63",
              name: "myFun2",
              fullyQualifiedName: "JSObject1.myFun2",
              datasource: {
                userPermissions: [],
                name: "UNUSED_DATASOURCE",
                pluginId: "653236215e9a6424e4c04b63",
                workspaceId: "659d2e14d0cbfb0c5e0a7424",
                datasourceStorages: {},
                messages: [],
                isValid: true,
                new: true,
              },
              pageId: "659f81c8d0cbfb0c5e0a743b",
              collectionId: "659f88f3d0cbfb0c5e0a744c",
              actionConfiguration: {
                timeoutInMillisecond: 10000,
                paginationType: "NONE",
                encodeParamsToggle: true,
                body: "async function () {}",
                selfReferencingDataPaths: [],
                jsArguments: [],
              },
              executeOnLoad: false,
              runBehavior: "MANUAL",
              clientSideExecution: true,
              dynamicBindingPathList: [
                {
                  key: "body",
                },
              ],
              isValid: true,
              invalids: [],
              messages: [],
              jsonPathKeys: ["async function () {}"],
              confirmBeforeExecute: false,
              userPermissions: [
                "read:actions",
                "delete:actions",
                "execute:actions",
                "manage:actions",
              ],
              validName: "JSObject1.myFun2",
              entityReferenceType: "JSACTION",
              selfReferencingDataPaths: [],
            },
          ],
          archivedActions: [],
          body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}",
          variables: [
            {
              name: "myVar1",
              value: "[]",
            },
            {
              name: "myVar2",
              value: "{}",
            },
          ],
          userPermissions: [
            "read:actions",
            "delete:actions",
            "execute:actions",
            "manage:actions",
          ],
        },
      },
      {
        isLoading: false,
        config: {
          id: "659f8264d0cbfb0c5e0a7445",
          applicationId: "659f81c8d0cbfb0c5e0a7439",
          workspaceId: "659d2e14d0cbfb0c5e0a7424",
          name: "testJSObject",
          pageId: "659f81c8d0cbfb0c5e0a743b",
          pluginId: "653236215e9a6424e4c04b63",
          pluginType: "JS",
          actionIds: [],
          archivedActionIds: [],
          actions: [
            {
              id: "659f8264d0cbfb0c5e0a7443",
              applicationId: "659f81c8d0cbfb0c5e0a7439",
              workspaceId: "659d2e14d0cbfb0c5e0a7424",
              pluginType: "JS",
              pluginId: "653236215e9a6424e4c04b63",
              name: "myFun2",
              fullyQualifiedName: "testJSObject.myFun2",
              datasource: {
                userPermissions: [],
                name: "UNUSED_DATASOURCE",
                pluginId: "653236215e9a6424e4c04b63",
                workspaceId: "659d2e14d0cbfb0c5e0a7424",
                datasourceStorages: {},
                messages: [],
                isValid: true,
                new: true,
              },
              pageId: "659f81c8d0cbfb0c5e0a743b",
              collectionId: "659f8264d0cbfb0c5e0a7445",
              actionConfiguration: {
                timeoutInMillisecond: 10000,
                paginationType: "NONE",
                encodeParamsToggle: true,
                body: "async function () {}",
                selfReferencingDataPaths: [],
                jsArguments: [],
              },
              executeOnLoad: false,
              runBehavior: "MANUAL",
              clientSideExecution: true,
              dynamicBindingPathList: [
                {
                  key: "body",
                },
              ],
              isValid: true,
              invalids: [],
              messages: [],
              jsonPathKeys: ["async function () {}"],
              confirmBeforeExecute: false,
              userPermissions: [
                "read:actions",
                "delete:actions",
                "execute:actions",
                "manage:actions",
              ],
              validName: "testJSObject.myFun2",
              entityReferenceType: "JSACTION",
              selfReferencingDataPaths: [],
            },
            {
              id: "659f8264d0cbfb0c5e0a7442",
              applicationId: "659f81c8d0cbfb0c5e0a7439",
              workspaceId: "659d2e14d0cbfb0c5e0a7424",
              pluginType: "JS",
              pluginId: "653236215e9a6424e4c04b63",
              name: "myFun1",
              fullyQualifiedName: "testJSObject.myFun1",
              datasource: {
                userPermissions: [],
                name: "UNUSED_DATASOURCE",
                pluginId: "653236215e9a6424e4c04b63",
                workspaceId: "659d2e14d0cbfb0c5e0a7424",
                datasourceStorages: {},
                messages: [],
                isValid: true,
                new: true,
              },
              pageId: "659f81c8d0cbfb0c5e0a743b",
              collectionId: "659f8264d0cbfb0c5e0a7445",
              actionConfiguration: {
                timeoutInMillisecond: 10000,
                paginationType: "NONE",
                encodeParamsToggle: true,
                body: "function () {}",
                selfReferencingDataPaths: [],
                jsArguments: [],
              },
              executeOnLoad: false,
              runBehavior: "MANUAL",
              clientSideExecution: true,
              dynamicBindingPathList: [
                {
                  key: "body",
                },
              ],
              isValid: true,
              invalids: [],
              messages: [],
              jsonPathKeys: ["function () {}"],
              confirmBeforeExecute: false,
              userPermissions: [
                "read:actions",
                "delete:actions",
                "execute:actions",
                "manage:actions",
              ],
              validName: "testJSObject.myFun1",
              entityReferenceType: "JSACTION",
              selfReferencingDataPaths: [],
            },
          ],
          archivedActions: [],
          body: "export default {\n\tmyVar1: [],\n\tmyVar2: {},\n\tmyFun1 () {\n\t\t//\twrite code here\n\t\t//\tthis.myVar1 = [1,2,3]\n\t},\n\tasync myFun2 () {\n\t\t//\tuse async-await or promises\n\t\t//\tawait storeValue('varName', 'hello world')\n\t}\n}",
          variables: [
            {
              name: "myVar1",
              value: "[]",
            },
            {
              name: "myVar2",
              value: "{}",
            },
          ],
          userPermissions: [
            "read:actions",
            "delete:actions",
            "execute:actions",
            "manage:actions",
          ],
        },
      },
    ],
    autoHeightLayoutTree: {
      "76t6mkfckv": {
        aboves: [],
        belows: ["30s2xz9lqx"],
        topRow: 1,
        bottomRow: 5,
        originalTopRow: 1,
        originalBottomRow: 5,
        distanceToNearestAbove: 0,
      },
      "30s2xz9lqx": {
        aboves: ["76t6mkfckv"],
        belows: [],
        topRow: 6,
        bottomRow: 64,
        originalTopRow: 6,
        originalBottomRow: 64,
        distanceToNearestAbove: 1,
      },
      gz1wda6co5: {
        aboves: [],
        belows: [],
        topRow: 6,
        bottomRow: 64,
        originalTopRow: 6,
        originalBottomRow: 64,
        distanceToNearestAbove: 0,
      },
      jf6mghk92c: {
        aboves: [],
        belows: [
          "6st25auvr3",
          "4hqs7tr225",
          "z434i5dlb7",
          "v03001ino4",
          "u753uo6af8",
          "z5j3zsmu38",
          "81esy5jfi0",
          "3etip5rg1a",
          "gsgr0ynhbb",
        ],
        topRow: 1,
        bottomRow: 10,
        originalTopRow: 1,
        originalBottomRow: 10,
        distanceToNearestAbove: 0,
      },
      ksqoq712gb: {
        aboves: [],
        belows: [
          "y4kqr6s084",
          "6st25auvr3",
          "oid24ma9vw",
          "4hqs7tr225",
          "5qcop7cwtm",
          "z434i5dlb7",
          "308vo9jh63",
          "v03001ino4",
          "2xoes8wilz",
          "u753uo6af8",
          "z5vabtkhbb",
          "z5j3zsmu38",
          "yrnf6ebevh",
          "81esy5jfi0",
          "49fw3yiijl",
          "3etip5rg1a",
          "av2rmb7w6k",
          "gsgr0ynhbb",
        ],
        topRow: 2,
        bottomRow: 6,
        originalTopRow: 2,
        originalBottomRow: 6,
        distanceToNearestAbove: 0,
      },
      y4kqr6s084: {
        aboves: ["ksqoq712gb"],
        belows: [
          "6st25auvr3",
          "oid24ma9vw",
          "4hqs7tr225",
          "5qcop7cwtm",
          "z434i5dlb7",
          "308vo9jh63",
          "v03001ino4",
          "2xoes8wilz",
          "u753uo6af8",
          "z5vabtkhbb",
          "z5j3zsmu38",
          "yrnf6ebevh",
          "81esy5jfi0",
          "49fw3yiijl",
          "3etip5rg1a",
          "av2rmb7w6k",
          "gsgr0ynhbb",
        ],
        topRow: 6,
        bottomRow: 10,
        originalTopRow: 6,
        originalBottomRow: 10,
        distanceToNearestAbove: 0,
      },
      "6st25auvr3": {
        aboves: ["jf6mghk92c", "ksqoq712gb", "y4kqr6s084"],
        belows: [
          "oid24ma9vw",
          "4hqs7tr225",
          "5qcop7cwtm",
          "z434i5dlb7",
          "308vo9jh63",
          "v03001ino4",
          "2xoes8wilz",
          "u753uo6af8",
          "z5vabtkhbb",
          "z5j3zsmu38",
          "yrnf6ebevh",
          "81esy5jfi0",
          "49fw3yiijl",
          "3etip5rg1a",
          "av2rmb7w6k",
          "gsgr0ynhbb",
        ],
        topRow: 10,
        bottomRow: 14,
        originalTopRow: 10,
        originalBottomRow: 14,
        distanceToNearestAbove: 0,
      },
      oid24ma9vw: {
        aboves: ["ksqoq712gb", "y4kqr6s084", "6st25auvr3"],
        belows: [
          "5qcop7cwtm",
          "308vo9jh63",
          "2xoes8wilz",
          "z5vabtkhbb",
          "yrnf6ebevh",
          "49fw3yiijl",
          "av2rmb7w6k",
        ],
        topRow: 14,
        bottomRow: 18,
        originalTopRow: 14,
        originalBottomRow: 18,
        distanceToNearestAbove: 0,
      },
      "4hqs7tr225": {
        aboves: ["jf6mghk92c", "ksqoq712gb", "y4kqr6s084", "6st25auvr3"],
        belows: [
          "z434i5dlb7",
          "v03001ino4",
          "u753uo6af8",
          "z5j3zsmu38",
          "81esy5jfi0",
          "3etip5rg1a",
          "gsgr0ynhbb",
        ],
        topRow: 14,
        bottomRow: 18,
        originalTopRow: 14,
        originalBottomRow: 18,
        distanceToNearestAbove: 0,
      },
      "5qcop7cwtm": {
        aboves: ["ksqoq712gb", "y4kqr6s084", "6st25auvr3", "oid24ma9vw"],
        belows: [
          "308vo9jh63",
          "2xoes8wilz",
          "z5vabtkhbb",
          "yrnf6ebevh",
          "49fw3yiijl",
          "av2rmb7w6k",
        ],
        topRow: 19,
        bottomRow: 23,
        originalTopRow: 19,
        originalBottomRow: 23,
        distanceToNearestAbove: 1,
      },
      z434i5dlb7: {
        aboves: [
          "jf6mghk92c",
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "4hqs7tr225",
        ],
        belows: [
          "v03001ino4",
          "u753uo6af8",
          "z5j3zsmu38",
          "81esy5jfi0",
          "3etip5rg1a",
          "gsgr0ynhbb",
        ],
        topRow: 19,
        bottomRow: 23,
        originalTopRow: 19,
        originalBottomRow: 23,
        distanceToNearestAbove: 1,
      },
      "308vo9jh63": {
        aboves: [
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "oid24ma9vw",
          "5qcop7cwtm",
        ],
        belows: [
          "2xoes8wilz",
          "z5vabtkhbb",
          "yrnf6ebevh",
          "49fw3yiijl",
          "av2rmb7w6k",
        ],
        topRow: 25,
        bottomRow: 29,
        originalTopRow: 25,
        originalBottomRow: 29,
        distanceToNearestAbove: 2,
      },
      v03001ino4: {
        aboves: [
          "jf6mghk92c",
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "4hqs7tr225",
          "z434i5dlb7",
        ],
        belows: [
          "u753uo6af8",
          "z5j3zsmu38",
          "81esy5jfi0",
          "3etip5rg1a",
          "gsgr0ynhbb",
        ],
        topRow: 25,
        bottomRow: 29,
        originalTopRow: 25,
        originalBottomRow: 29,
        distanceToNearestAbove: 2,
      },
      "2xoes8wilz": {
        aboves: [
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "oid24ma9vw",
          "5qcop7cwtm",
          "308vo9jh63",
        ],
        belows: ["z5vabtkhbb", "yrnf6ebevh", "49fw3yiijl", "av2rmb7w6k"],
        topRow: 30,
        bottomRow: 34,
        originalTopRow: 30,
        originalBottomRow: 34,
        distanceToNearestAbove: 1,
      },
      u753uo6af8: {
        aboves: [
          "jf6mghk92c",
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "4hqs7tr225",
          "z434i5dlb7",
          "v03001ino4",
        ],
        belows: ["z5j3zsmu38", "81esy5jfi0", "3etip5rg1a", "gsgr0ynhbb"],
        topRow: 30,
        bottomRow: 34,
        originalTopRow: 30,
        originalBottomRow: 34,
        distanceToNearestAbove: 1,
      },
      z5vabtkhbb: {
        aboves: [
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "oid24ma9vw",
          "5qcop7cwtm",
          "308vo9jh63",
          "2xoes8wilz",
        ],
        belows: ["yrnf6ebevh", "49fw3yiijl", "av2rmb7w6k"],
        topRow: 35,
        bottomRow: 39,
        originalTopRow: 35,
        originalBottomRow: 39,
        distanceToNearestAbove: 1,
      },
      z5j3zsmu38: {
        aboves: [
          "jf6mghk92c",
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "4hqs7tr225",
          "z434i5dlb7",
          "v03001ino4",
          "u753uo6af8",
        ],
        belows: ["81esy5jfi0", "3etip5rg1a", "gsgr0ynhbb"],
        topRow: 35,
        bottomRow: 39,
        originalTopRow: 35,
        originalBottomRow: 39,
        distanceToNearestAbove: 1,
      },
      yrnf6ebevh: {
        aboves: [
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "oid24ma9vw",
          "5qcop7cwtm",
          "308vo9jh63",
          "2xoes8wilz",
          "z5vabtkhbb",
        ],
        belows: ["49fw3yiijl", "av2rmb7w6k"],
        topRow: 40,
        bottomRow: 44,
        originalTopRow: 40,
        originalBottomRow: 44,
        distanceToNearestAbove: 1,
      },
      "81esy5jfi0": {
        aboves: [
          "jf6mghk92c",
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "4hqs7tr225",
          "z434i5dlb7",
          "v03001ino4",
          "u753uo6af8",
          "z5j3zsmu38",
        ],
        belows: ["3etip5rg1a", "gsgr0ynhbb"],
        topRow: 40,
        bottomRow: 44,
        originalTopRow: 40,
        originalBottomRow: 44,
        distanceToNearestAbove: 1,
      },
      "49fw3yiijl": {
        aboves: [
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "oid24ma9vw",
          "5qcop7cwtm",
          "308vo9jh63",
          "2xoes8wilz",
          "z5vabtkhbb",
          "yrnf6ebevh",
        ],
        belows: ["av2rmb7w6k"],
        topRow: 45,
        bottomRow: 49,
        originalTopRow: 45,
        originalBottomRow: 49,
        distanceToNearestAbove: 1,
      },
      "3etip5rg1a": {
        aboves: [
          "jf6mghk92c",
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "4hqs7tr225",
          "z434i5dlb7",
          "v03001ino4",
          "u753uo6af8",
          "z5j3zsmu38",
          "81esy5jfi0",
        ],
        belows: ["gsgr0ynhbb"],
        topRow: 45,
        bottomRow: 49,
        originalTopRow: 45,
        originalBottomRow: 49,
        distanceToNearestAbove: 1,
      },
      av2rmb7w6k: {
        aboves: [
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "oid24ma9vw",
          "5qcop7cwtm",
          "308vo9jh63",
          "2xoes8wilz",
          "z5vabtkhbb",
          "yrnf6ebevh",
          "49fw3yiijl",
        ],
        belows: [],
        topRow: 50,
        bottomRow: 54,
        originalTopRow: 50,
        originalBottomRow: 54,
        distanceToNearestAbove: 1,
      },
      gsgr0ynhbb: {
        aboves: [
          "jf6mghk92c",
          "ksqoq712gb",
          "y4kqr6s084",
          "6st25auvr3",
          "4hqs7tr225",
          "z434i5dlb7",
          "v03001ino4",
          "u753uo6af8",
          "z5j3zsmu38",
          "81esy5jfi0",
          "3etip5rg1a",
        ],
        belows: [],
        topRow: 50,
        bottomRow: 54,
        originalTopRow: 50,
        originalBottomRow: 54,
        distanceToNearestAbove: 1,
      },
    },
    canvasLevels: {
      "0": 0,
      "1c72qpylh0": 1,
    },
    layoutElementPositions: {},
    moduleInstanceEntities: {},
  },
  ui: {
    analytics: {
      telemetry: {
        segmentState: "INIT_UNCERTAIN",
      },
    },
    editor: {
      widgetConfigBuilt: true,
      initialized: true,
      loadingStates: {
        publishing: false,
        publishingError: false,
        saving: false,
        savingError: false,
        savingEntity: false,
        loading: false,
        loadingError: false,
        pageSwitchingError: false,
        isPageSwitching: false,
        creatingPage: false,
        creatingPageError: false,
        cloningPage: false,
        cloningPageError: false,
        updatingWidgetName: false,
        updateWidgetNameError: false,
      },
      isSnipingMode: false,
      isPreviewMode: false,
      isProtectedMode: true,
      zoomLevel: 1,
      currentPageName: "Home",
      currentLayoutId: "659f81c8d0cbfb0c5e0a743a",
      pageWidgetId: "0",
      currentApplicationId: "659f81c8d0cbfb0c5e0a7439",
      currentPageId: "659f81c8d0cbfb0c5e0a743b",
      pageActions: [
        [
          {
            id: "659f81c8d0cbfb0c5e0a743e",
            name: "getUsers",
            confirmBeforeExecute: false,
            pluginType: "DB",
            jsonPathKeys: [],
            timeoutInMillisecond: 10000,
          },
        ],
      ],
      layoutOnLoadActionErrors: [],
      lastUpdatedTime: 1704954100,
    },
    errors: {
      safeCrash: false,
      currentError: {
        sourceAction: "",
        message: "",
        stackTrace: "",
      },
    },
    propertyPane: {
      isVisible: false,
      isNew: false,
      width: 288,
      selectedPropertyPanel: {},
    },
    tableFilterPane: {
      isVisible: false,
    },
    appView: {
      isFetchingPage: false,
      initialized: false,
      headerHeight: 0,
    },
    applications: {
      isFetchingApplications: false,
      isSavingAppName: false,
      isErrorSavingAppName: false,
      isFetchingApplication: false,
      isChangingViewAccess: false,
      applicationList: [],
      creatingApplication: {},
      deletingApplication: false,
      forkingApplication: false,
      userWorkspaces: [],
      isSavingWorkspaceInfo: false,
      importingApplication: false,
      importedApplication: null,
      isImportAppModalOpen: false,
      workspaceIdForImport: null,
      pageIdForImport: "",
      isAppSidebarPinned: true,
      isSavingNavigationSetting: false,
      isErrorSavingNavigationSetting: false,
      isUploadingNavigationLogo: false,
      isDeletingNavigationLogo: false,
      deletingMultipleApps: {},
      loadingStates: {
        isFetchingAllRoles: false,
        isFetchingAllUsers: false,
      },
      partialImportExport: {
        isExportModalOpen: false,
        isExporting: false,
        isExportDone: false,
        isImportModalOpen: false,
        isImporting: false,
        isImportDone: false,
      },
      currentApplication: {
        applicationDetail: {
          appPositioning: {
            type: "FIXED",
          },
          navigationSetting: {
            showNavbar: true,
            showSignIn: true,
            orientation: "top",
            navStyle: "stacked",
            position: "static",
            itemStyle: "text",
            colorStyle: "light",
            logoAssetId: "",
            logoConfiguration: "logoAndApplicationTitle",
          },
        },
        id: "659f81c8d0cbfb0c5e0a7439",
        modifiedBy: "jacques@adasdsad.com",
        userPermissions: [
          "manage:applications",
          "canComment:applications",
          "export:applications",
          "manageProtectedBranches:applications",
          "read:applications",
          "manageDefaultBranches:applications",
          "create:pages",
          "publish:applications",
          "connectToGit:applications",
          "manageAutoCommit:applications",
          "delete:applications",
          "makePublic:applications",
        ],
        name: "View Data",
        workspaceId: "659d2e14d0cbfb0c5e0a7424",
        isPublic: false,
        appIsExample: false,
        unreadCommentThreads: 0,
        color: "#D9E7FF",
        icon: "basketball",
        slug: "view-data",
        unpublishedCustomJSLibs: [],
        publishedCustomJSLibs: [],
        evaluationVersion: 2,
        applicationVersion: 2,
        collapseInvisibleWidgets: true,
        isManualUpdate: true,
        isAutoUpdate: false,
        forkedFromTemplateTitle: "View Data",
        appLayout: {
          type: "DESKTOP",
        },
        new: false,
        modifiedAt: "2024-01-11T06:21:40.495Z",
        pages: [
          {
            id: "659f81c8d0cbfb0c5e0a743b",
            name: "Home",
            slug: "home",
            isDefault: true,
            isHidden: false,
            userPermissions: [
              "read:pages",
              "manage:pages",
              "create:pageActions",
              "delete:pages",
            ],
          },
        ],
      },
    },
    apiPane: {
      isCreating: false,
      isFetching: false,
      isRunning: {},
      isSaving: {},
      isDeleting: {},
      isDirty: {},
      currentCategory: "",
      extraformData: {},
      selectedConfigTabIndex: 0,
      selectedResponseTab: "",
    },
    auth: {
      isValidatingToken: true,
      isTokenValid: false,
    },
    templates: {
      isImportingTemplate: false,
      isImportingTemplateToApp: false,
      loadingFilters: false,
      gettingAllTemplates: false,
      gettingTemplate: false,
      activeTemplate: null,
      activeLoadingTemplateId: null,
      templates: [
        {
          id: "6222224900c64549b31b9467",
          userPermissions: [],
          title: "Fund Raising CRM",
          description:
            "This Fundraising CRM, allows for secure and direct communication between a company, and their investors, allowing users to maintain track of their communications.",
          appUrl:
            "https://app.appsmith.com/applications/61dbc9d66bd5757f166cc898/pages/6204a671552a5f63958772aa/b?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/FundRaisingCRM_Enabled.json",
          gifUrl: "",
          sortPriority: "1001",
          screenshotUrls: [
            "https://assets.appsmith.com/templates/screenshots/FundRaisingCRM.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "FILE_PICKER_WIDGET_V2",
            "FORM_WIDGET",
            "ICON_BUTTON_WIDGET",
            "INPUT_WIDGET_V2",
            "LIST_WIDGET_V2",
            "MAP_WIDGET",
            "MODAL_WIDGET",
            "RATE_WIDGET",
            "RICH_TEXT_EDITOR_WIDGET",
            "TEXT_WIDGET",
          ],
          functions: [],
          useCases: ["Finance", "Information Technology (IT)"],
          datasources: ["amazons3-plugin", "google-sheets-plugin"],
          pages: [
            {
              id: "6204a671552a5f63958772aa",
              name: "Investors",
              slug: "investors",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.6.11-SNAPSHOT",
          minVersionPadded: "000010000600011",
          downloadCount: 0,
          active: true,
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f7e8a47a7d75706eb6ef7",
          userPermissions: [],
          title: "Meeting Scheduler",
          description:
            "Create a free app that lets users schedule meetings with you based on your google calendar ",
          appUrl:
            "https://release.app.appsmith.com/app/meeting-scheduler/calendar-mobile-6569a7cdeeee0b1d0755ff2c?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/MeetingScheduler.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/MeetingScheduler.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "FORM_WIDGET",
            "CONTAINER_WIDGET",
            "INPUT_WIDGET_V2",
            "IMAGE_WIDGET",
            "MODAL_WIDGET",
          ],
          functions: ["Operations", "Information Technology (IT)"],
          useCases: [
            "Sales",
            "Finance",
            "Support",
            "Marketing",
            "Project Management",
          ],
          datasources: ["restapi-plugin"],
          pages: [
            {
              id: "6569a7cdeeee0b1d0755ff2c",
              name: "Calendar Mobile",
              slug: "calendar-mobile",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.6.22-SNAPSHOT",
          minVersionPadded: "000010000600022",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nScheduling team meetings without the hassle of back and forth conversations is passé. With this app, you can let anyone set up and create meetings. All you have to do is authorize your Google Calendar and share the app with anyone you would like to.\n\nYou can completely customize the duration of meetings and let your friends and colleagues know when they can reach you. You can also add in multiple visitors, and if you have a meeting URL, you can also add that.\n\nSchedule Team Meetings without the Hassle of Back-and-Forth Emails.\n\n#### __Highlights of the app__\n- Users can create unlimited custom meeting durations\n- Users can set their working hours on the settings page\n- You can schedule meetings at any available time while maintaining privacy\n- If you have a Zoom account, you can add in meeting links, so no extra work is required\n- You can customize the meeting text to attach your meeting ID without any integration required.",
          excerpt:
            "Get data from various databases; analyze & visualize them in one dashboard to build a unified view.",
          category: "Others",
          featured: true,
          tags: [
            "meeting scheduling",
            "team meetings",
            "calendar integration",
            "customization",
            "Zoom",
          ],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f7dca47a7d75706eb6ef6",
          userPermissions: [],
          title: "WhatsApp CRM",
          description:
            "Dynamically generate custom messages from your data using this WhatsApp link builder, then send the message to a WhatsApp user",
          appUrl:
            "https://app.appsmith.com/app/whatsapp-messenger/page1-6261b50800cba01cd02f256a?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/WhatsAppMessenger.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/WhatsappScreenShot.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "FORM_WIDGET",
            "CONTAINER_WIDGET",
            "INPUT_WIDGET_V2",
            "TEXT_WIDGET",
            "BUTTON_GROUP_WIDGET",
            "IMAGE_WIDGET",
            "LIST_WIDGET_V2",
            "MODAL_WIDGET",
          ],
          functions: ["Communications"],
          useCases: ["Communications", "Personal", "Remote work"],
          datasources: ["postgres-plugin", "restapi-plugin"],
          pages: [
            {
              id: "6261b50800cba01cd02f256a",
              name: "Page1",
              slug: "page1",
              isDefault: true,
            },
          ],
          minVersion: "v1.7.1-SNAPSHOT",
          minVersionPadded: "000010000700001",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nDynamically generate custom messages from your data using this WhatsApp link builder, then send the message to a WhatsApp user. This example uses our Mock Users sample dataset, which can easily be swapped out for your CRM data to build a custom messaging tool for your team.\n\n#### __Highlights of the app__\n- Users can select a Contact from the table widget and auto-generate a new message to the user\n- Users can select between different message templates\n- Users can edit or add to the message before sending\n- Users can send a custom message without using the templates",
          excerpt:
            "Generate custom messages from a template, then send the message to a WhatsApp user.",
          category: "Marketing",
          featured: true,
          tags: [
            "whatsapp",
            "custom messaging",
            "data-driven",
            "CRM",
            "messaging tool",
          ],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f730247a7d75706eb6ef3",
          userPermissions: [],
          title: "Business Analytics Dashboard",
          description:
            "Pool in data from different databases, analyze and visualize them in one dashboard to help with critical decisions like successful scaling of operations.",
          appUrl:
            "https://app.appsmith.com/app/business-analytics-dashboard/car-showroom-6256ad4d0d3d384069c06c68?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/business-analytics-dashboard.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/BusinessAnalyticsDashboard.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CHART_WIDGET",
            "SELECT_WIDGET",
            "CONTAINER_WIDGET",
            "INPUT_WIDGET_V2",
            "TEXT_WIDGET",
            "DATE_PICKER_WIDGET2",
            "ICON_BUTTON_WIDGET",
            "LIST_WIDGET_V2",
            "MENU_BUTTON_WIDGET",
            "MULTI_SELECT_WIDGET_V2",
            "RATE_WIDGET",
            "CURRENCY_INPUT_WIDGET",
            "MODAL_WIDGET",
            "STATBOX_WIDGET",
            "TABLE_WIDGET_V2",
          ],
          functions: ["Sales"],
          useCases: ["Sales"],
          datasources: ["postgres-plugin", "mongo-plugin"],
          pages: [
            {
              id: "6256ad4d0d3d384069c06c68",
              name: "Car showroom",
              slug: "car-showroom",
              isDefault: true,
              isHidden: false,
            },
            {
              id: "6256ad4d0d3d384069c06c66",
              name: "Car servicing",
              slug: "car-servicing",
              isDefault: false,
              isHidden: false,
            },
            {
              id: "6256ad4d0d3d384069c06c6a",
              name: "Business dashboard",
              slug: "business-dashboard",
              isDefault: false,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.5",
          minVersionPadded: "000010000700005",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nOrganizations that have businesses running in various verticals have information generated across all domains. Not having a shared dashboard to analyze statistics at a glance makes it difficult for the organization to get a holistic view of its business and revenue.\n\nThis app visualizes the use case of a car showroom business with maintenance verticals. The template can help pool data from various data sources into one dashboard, enabling stakeholders to analyze critical metrics across all business verticals in one place.\n\n#### __Highlights of the app__\n- Users can view the showroom deals by a server-side paginated list and search through this list.\n- Users can update fields in a showroom deal using the form.\n- Users can view the repair and maintenance deals by a server-side paginated list and can search through the list.\n- Users can update fields in a repair deal using the form.\n- Users can pool data from various data sources in a dashboard.\n- Users can see the statistics of the deals and revenue generated.\n- Users can visualize the data using charts and progress bars for various parameters.",
          excerpt:
            "Get data from various databases; analyze & visualize them in one dashboard to build a unified view.",
          category: "Sales",
          featured: true,
          tags: [
            "dashboard",
            "data analysis",
            "business metrics",
            "car showroom",
            "maintenance",
          ],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f72ab47a7d75706eb6ef2",
          userPermissions: [],
          title: "Vehicle Maintenance App",
          description:
            "This app is used to manage and schedule a car’s maintenance according to its needs and age.  A new vehicle can be registered and upcoming service notifications can be monitored.",
          appUrl:
            "https://app.appsmith.com/app/vehicle-maintenance-app/home-page-62a825fc84b91337251a0580?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/vehicle-maintenance-app.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/vehicle-maintenance-app.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "INPUT_WIDGET_V2",
            "TEXT_WIDGET",
            "DATE_PICKER_WIDGET2",
            "ICON_BUTTON_WIDGET",
            "LIST_WIDGET_V2",
            "MODAL_WIDGET",
          ],
          functions: ["Operations"],
          useCases: ["Sales", "Support"],
          datasources: ["postgres-plugin"],
          pages: [
            {
              id: "62a825fc84b91337251a0580",
              name: "Home page",
              slug: "home-page",
              isDefault: true,
              isHidden: false,
            },
            {
              id: "62a825fc84b91337251a0582",
              name: "New vehicle",
              slug: "new-vehicle",
              isDefault: false,
              isHidden: false,
            },
            {
              id: "62a825fc84b91337251a057f",
              name: "Schedule",
              slug: "schedule",
              isDefault: false,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.5",
          minVersionPadded: "000010000700005",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nCars and other equipment need periodic maintenance. Monitoring the service dates and preventive maintenance deadlines for various cars is difficult for a workshop/organization. This brings in the need for a service notification and preventive maintenance management template.\n\nThis app is used to manage and schedule a car's maintenance according to its needs and age. A new vehicle can be registered, and upcoming service notifications can be monitored.\n\n#### __Highlights of the app__\n- Users can register a new vehicle\n- Users can register service for an existing vehicle\n- Users can check if service is due for a vehicle\n- Users can see all the necessary information of a vehicle\n- Users can see the maintenance schedule of all vehicles at a glance",
          excerpt:
            "An app to schedule vehicle maintenance, add new vehicle details and monitor service notifications.",
          category: "Customer Support",
          featured: true,
          tags: [
            "maintenance management",
            "service notifications",
            "preventive maintenance",
            "vehicle registration",
          ],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f717b47a7d75706eb6ef1",
          userPermissions: [],
          title: "Employee Feedback Form Builder",
          description:
            "This is a form maker for an employee to collect periodic feedback. With this app, an employee can view their rating and all periodic feedback on the dashboard.",
          appUrl:
            "https://app.appsmith.com/app/employee-feedback-form-builder/form-maker-628c6b127901344ba8d210f4?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/Employee-Feedback-Form-Builder.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/employeefeedbackform.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "INPUT_WIDGET_V2",
            "TEXT_WIDGET",
            "IMAGE_WIDGET",
            "LIST_WIDGET_V2",
            "RICH_TEXT_EDITOR_WIDGET",
            "TABS_WIDGET",
          ],
          functions: ["All"],
          useCases: ["Remote work", "Human Resources (HR)"],
          datasources: ["postgres-plugin"],
          pages: [
            {
              id: "628c6b127901344ba8d210f4",
              name: "Form Maker",
              slug: "form-maker",
              isDefault: true,
              isHidden: false,
            },
            {
              id: "628c6b127901344ba8d210f0",
              name: "Feedback Form",
              slug: "feedback-form",
              isDefault: false,
              isHidden: false,
            },
            {
              id: "628c6b127901344ba8d210f6",
              name: "Responses",
              slug: "responses",
              isDefault: false,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.5",
          minVersionPadded: "000010000700005",
          downloadCount: 0,
          active: true,
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f713047a7d75706eb6ef0",
          userPermissions: [],
          title: "Maintenance Order Management",
          description:
            "This app is used to maintain and analyze the work/maintenance orders that are received by an organization. A new work order can be created and filtered agent wise.",
          appUrl:
            "https://release.app.appsmith.com/app/maintenance-order-management/home-page-6556b45bcf6a5519d6159dd7?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/maintenance-order-management.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/maintenanceordermanagement.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CHART_WIDGET",
            "SELECT_WIDGET",
            "CONTAINER_WIDGET",
            "INPUT_WIDGET_V2",
            "TEXT_WIDGET",
            "DATE_PICKER_WIDGET2",
            "ICON_BUTTON_WIDGET",
            "IMAGE_WIDGET",
            "LIST_WIDGET_V2",
            "MENU_BUTTON_WIDGET",
            "CHECKBOX_WIDGET",
            "CURRENCY_INPUT_WIDGET",
            "MODAL_WIDGET",
            "STATBOX_WIDGET",
            "TABLE_WIDGET_V2",
          ],
          functions: ["Human Resources"],
          useCases: ["Human Resources", "Project Management", "Remote Work"],
          datasources: ["postgres-plugin"],
          pages: [
            {
              id: "6556b45bcf6a5519d6159dd7",
              name: "Home Page",
              slug: "home-page",
              isDefault: true,
              isHidden: false,
            },
            {
              id: "6556b45bcf6a5519d6159dd6",
              name: "Submit new order",
              slug: "submit-new-order",
              isDefault: false,
              isHidden: false,
            },
            {
              id: "6556b45bcf6a5519d6159dd9",
              name: "My orders",
              slug: "my-orders",
              isDefault: false,
              isHidden: false,
            },
            {
              id: "6556b45bcf6a5519d6159dd8",
              name: "Admin",
              slug: "admin",
              isDefault: false,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.5",
          minVersionPadded: "000010000700005",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nConsumer goods organizations get a lot of work/service orders every day. Being able to manage and assign the services effectively keeps a customer happy. It can help organizations manage their service schedules and work orders efficiently.\n\nThis app can be used to maintain and analyze the work/maintenance orders received. User can create new work orders or update an existing work order, as well as analyze the distribution of work orders for an agent.\n\n#### __Highlights of the app__\n- Users (customers) can create a new work order.\n- Users (customers) can see all work orders created by them.\n- Users (agents) can see their work orders.\n- Users (agents) can update their work orders.\n- Users (admin) can see all the work orders.\n- Users (admin) can see orders agent wise.\n- Users (admin) can see the distribution of the equipment work orders per agent.",
          excerpt:
            "Use the app to create new work orders, filter them by agents, and analyze all work orders received.",
          category: "Customer Support",
          featured: true,
          tags: ["customer", "support", "dashboard", "maintenance"],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f601347a7d75706eb6e9a",
          userPermissions: [],
          title: "Employee Time Tracker",
          description:
            "Track hours on various tasks, view total time by task, and view logs of all time entries.",
          appUrl:
            "https://app.appsmith.com/app/employee-time-tracker/time-log-63165a2a1df89313e25792b0?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/employee-time-tracker.json",
          gifUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/employee-time-tracker.gif",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/employee-time-tracker.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "SELECT_WIDGET",
            "CONTAINER_WIDGET",
            "TEXT_WIDGET",
            "ICON_BUTTON_WIDGET",
            "LIST_WIDGET_V2",
            "MODAL_WIDGET",
            "TABLE_WIDGET_V2",
          ],
          functions: ["Human Resources"],
          useCases: ["Human Resources", "Project Management", "Remote Work"],
          datasources: ["postgres-plugin"],
          pages: [
            {
              id: "63165a2a1df89313e25792b0",
              name: "Time Log",
              slug: "time-log",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.14",
          minVersionPadded: "000010000700014",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nOrganizations often need a way to track employees’ work hours on various tasks, to assist with planning and project management. This Employee Time Tracker app allows employees to clock in and out on different tasks, logging their work efforts and viewing total hours logged per employee or task.\n\n#### __Highlights of the app__\n- Employees can clock-in/clock-out to log time spent on a Task\n- Employees can view logs of their work on all Tasks\n- Employees can select a Task to view total time worked",
          excerpt:
            "Track hours on various tasks, view total time by task, and view logs of all time entries.",
          category: "Human Resources",
          featured: true,
          tags: [
            "employee time tracking",
            "task management",
            "work hours",
            "project management",
          ],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631b6561bab73535961701ac",
          userPermissions: [],
          title: "Bugs and Issues Manager",
          description:
            "Create and track issues/bug reports and collect related screenshots, using Airtable to store data and files. ",
          appUrl:
            "https://app.appsmith.com/app/bugs-and-issues-manager/bugs-and-issues-62d5a32ab06ce90d91db6072?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/bugs-and-issues-manager.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/bugs-and-issues-manager.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "SELECT_WIDGET",
            "CONTAINER_WIDGET",
            "DOCUMENT_VIEWER_WIDGET",
            "INPUT_WIDGET_V2",
            "TEXT_WIDGET",
            "ICON_BUTTON_WIDGET",
            "IMAGE_WIDGET",
            "LIST_WIDGET_V2",
            "MODAL_WIDGET",
            "STATBOX_WIDGET",
            "JSON_FORM_WIDGET",
          ],
          functions: ["Other", "Information Technology (IT)"],
          useCases: ["Project Management", "Software Development"],
          datasources: ["61531b1b9370f312a0394f16"],
          pages: [
            {
              id: "62d5a32ab06ce90d91db6072",
              name: "Bugs and Issues",
              slug: "bugs-and-issues",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.13",
          minVersionPadded: "000010000700013",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nSoftware developers often use a system to track bugs and other issues reported by their users. This app allows users to report issues, track and update the status, and more, using Appsmith's Airtable integration to store data and images in an Airtable base.\n\n#### __Highlights of the app__\n- Users can view the existing bugs and open the attached images.\n- Users can add a new bug/issue.\n- Users can update the existing issue.\n- Users can change the Base ID and Table Name to connect their own datasource.\n‍",
          excerpt:
            "Create and track issues, bug reports and collect related screenshots using Airtable to store data and files.",
          category: "Human Resources",
          featured: true,
          tags: ["bug tracking", "issue management", "software development"],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "6318ccfd7e9aa41f2e0db691",
          userPermissions: [],
          title: "IT Asset Tracker",
          description:
            "Keep a track of an organization’s assets by assigning, and checking for any loss of assets or equipment, and ensure periodic maintenance.",
          appUrl:
            "https://app.appsmith.com/app/it-asset-tracker/dashboard-62554d3be52b06350af3a0b2?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/it-asset-tracker.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/IT-Asset-Tracker.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CHART_WIDGET",
            "SELECT_WIDGET",
            "CONTAINER_WIDGET",
            "INPUT_WIDGET_V2",
            "TEXT_WIDGET",
            "ICON_BUTTON_WIDGET",
            "IMAGE_WIDGET",
            "LIST_WIDGET_V2",
            "MENU_BUTTON_WIDGET",
            "MODAL_WIDGET",
            "STATBOX_WIDGET",
            "JSON_FORM_WIDGET",
          ],
          functions: ["Information Technology (IT)", "Operations"],
          useCases: ["Human Resources (HR)", "Remote work"],
          datasources: ["postgres-plugin"],
          pages: [
            {
              id: "62554d3be52b06350af3a0b2",
              name: "Dashboard",
              slug: "dashboard",
              isDefault: true,
              isHidden: false,
            },
            {
              id: "62554d3be52b06350af3a0b0",
              name: "Assets",
              slug: "assets",
              isDefault: false,
              isHidden: false,
            },
            {
              id: "62554d3be52b06350af3a0b4",
              name: "Employees",
              slug: "employees",
              isDefault: false,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.8",
          minVersionPadded: "000010000700008",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nAs organizations scale, managing inventory for company or business assets can prove to be challenging. Inventory management tools are great ways to keep track of assets that are used within the organization.\n\nWith this app, users can track an organization's assets, by assigning assets to employees, check for loss, and mark assets for periodic maintenance.\n\n#### __Highlights of the app__\n- Users can view the statistics of assets like number of total assets and returned assets.\n- Users can view different makes of the assets by asset type.\n- Users can view all the assets and their information at a glance.\n- Users can delete or modify asset details.\n- Users can see assets assigned to an employee.\n- Users can assign a new asset to an employee.\n‍",
          excerpt:
            "An app to let you track, categorize, and maintain the status of all your company’s IT assets.",
          category: "Human Resources",
          featured: true,
          tags: ["inventory", "management", "assets", "tracking", "employees"],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "62221b4900c64549b31b9465",
          userPermissions: [],
          title: "Marketing Dashboard",
          description:
            "Marketing teams can use this app to reach out to customers who are categorised into mailing lists using email, or discord messages",
          appUrl:
            "https://app.appsmith.com/applications/61efa094be698f35db5519a1/pages/61efa094be698f35db5519a4?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/CustomerCommunicationsPortal_enabled.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://assets.appsmith.com/templates/screenshots/CustomerCommunicationPortal.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "FORM_WIDGET",
            "ICON_BUTTON_WIDGET",
            "INPUT_WIDGET_V2",
            "LIST_WIDGET_V2",
            "MODAL_WIDGET",
            "SELECT_WIDGET",
            "STATBOX_WIDGET",
            "SWITCH_WIDGET",
            "TABS_WIDGET",
          ],
          functions: [],
          useCases: ["Sales"],
          datasources: ["mongo-plugin"],
          pages: [
            {
              id: "61efa094be698f35db5519a4",
              name: "Send Messages",
              slug: "send-messages",
              isDefault: true,
              isHidden: false,
            },
            {
              id: "61fb9c012cd3d95ca414b252",
              name: "Customer Data",
              slug: "customer-data",
              isDefault: false,
              isHidden: false,
            },
          ],
          minVersion: "v1.6.11-SNAPSHOT",
          minVersionPadded: "000010000600011",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nMarketers need to have a good pulse on their customers to make an impact. Consistently communicating with customers without spamming them is an excellent way of gaining their trust. Marketing teams can use this customer communications portal template to reach out to customers using various channels. In this template, customers are categorized into mailing lists, which means that we will be able to send targeted communications.\n\nThe marketing team can edit the marketing lists, adding any customer who is not on a do not disturb list. This is to respect customer privacy while also giving the marketing team a completely dynamic mailing list. Learn more to know how you can create a [digital marketing dashboard](https://www.appsmith.com/use-case/digital-marketing-dashboard) with Appsmith.\n\n#### __Highlights of the app__\n- Customers are categorized into mailing lists, which can be selected from a server-side paginated list.\n- After selecting a list, users are presented with a list of customers. Once selected, the user can reach out to customers via the connect now button.\n- Upon trying to connect with the users, they are shown a modal through which they can connect to the users using Appsmith’s built-in SMTP functionality and a discord message.\n- Users can create a base message and then adjust it for email and discord. Each of these will be rich text files, and you can add a subject line for emails.\n- Users can also disable either emails or discord messages.\n- Users can also edit their customer list, create new customers, and make new marketing lists.\n- Customers on a do-not-disturb list will not be added to any lists, protecting their privacy as per their request.",
          excerpt:
            "A custom customer communication portal for your marketing team.",
          category: "Marketing",
          featured: true,
          tags: [
            "customer communication",
            "mailing lists",
            "targeted marketing",
            "privacy protection",
          ],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "621c6c6589659f362e07f7b3",
          userPermissions: [],
          title: "Customer Support Dashboard",
          description:
            "This is an application for an e-commerce company that has to update the refund and delivery status of their orders due to ad-hoc issues raised off the platform.",
          appUrl:
            "https://release.app.appsmith.com/app/customer-support-dashboard/dashboard-655b5223698332571ea06768?embed=true&navbar=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/customer-support-dashboard.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://assets.appsmith.com/templates/screenshots/Customer_Support_Dashboard.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "FORM_WIDGET",
            "CONTAINER_WIDGET",
            "INPUT_WIDGET_V2",
            "ICON_BUTTON_WIDGET",
            "IMAGE_WIDGET",
            "LIST_WIDGET_V2",
            "MODAL_WIDGET",
          ],
          functions: [],
          useCases: ["Sales"],
          datasources: ["google-sheets-plugin"],
          pages: [
            {
              id: "655b5223698332571ea06768",
              name: "Dashboard",
              slug: "dashboard",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.6.11-SNAPSHOT",
          minVersionPadded: "000010000600011",
          downloadCount: 0,
          active: true,
          mdText:
            "#### __Overview__\nThis template is designed as an application for an e-commerce company that has to handle ad-hoc refund and delivery issues. The company?s Order Management system handles all returns and delivery issues that are generated on their website and app, however, they often receive requests on the phone, and via email.\n\nThis tool enables the Customer Support team to address delivery discrepancies in their system, issue partial or full refunds initiate replacements and observe important statistics at a glance.\n\n#### __Highlights of the app__\n- Dashboard showing important statistics and analysis\n- Search for customer by name, email, phone, and order id\n- View customer detail information and order history\n- View order details and take specific actions to manage the account\n- Refund, cancel, or update an order\n- Lookup delivery details\n- Initiate a return and replacement process\n- Add comments and notes to the order\n- Create a limited time coupon code specific to this user for their next purchase",
          excerpt:
            "An app to update refunds and delivery status of e-commerce orders.",
          category: "Customer Support",
          featured: true,
          tags: ["customer", "support", "dashboard", "management"],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "620b83e770a9752ffb1ad2db",
          userPermissions: [],
          title: "Customer Messaging Tool",
          description:
            "Utilize this template to effectively communicate with and manage consumers.  This program assists in selecting a group of clients, choosing the message type, and sending a WhatsApp message or SMS to them via the Twilio integration.\n",
          appUrl:
            "https://app.appsmith.com/app/customer-messaging-tool/customer-messaging-62d1acad279768242a2a6ab1?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/customer-messaging-tool.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/customer-messaging-tool.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "ICON_BUTTON_WIDGET",
            "LIST_WIDGET_V2",
            "MODAL_WIDGET",
            "PHONE_INPUT_WIDGET",
            "RICH_TEXT_EDITOR_WIDGET",
            "SELECT_WIDGET",
            "TEXT_WIDGET",
          ],
          functions: ["Marketing"],
          useCases: ["Marketing", "Communications"],
          datasources: ["postgres-plugin"],
          pages: [
            {
              id: "62d1acad279768242a2a6ab1",
              name: "Customer messaging",
              slug: "customer-messaging",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.9-SNAPSHOT",
          minVersionPadded: "000010000700009",
          downloadCount: 0,
          active: true,
          mdText:
            "\n### __Overview__\n\nOne of the most effective ways for companies to engage with customers is having a messaging tool in place. When customers join  the company's platform, or when they have a question about the product, or a  sales inquiry, a tool that enables them to seek answers and connect with the company will go a long way.\n\nUtilize this template to effectively communicate with and manage consumers. This program assists in selecting a group of clients, choosing the message type, and sending a WhatsApp message or SMS to them via the Twilio integration.\n\n#### __Highlights of the app__\n- Users can select a set of customers from the table of customers.\n- Users can select a message from a list of messages that can be sent to a customer. \n- Users can customize the message that is to be sent to a customer. \n- Users can send a SMS or a WhatsApp message to the selected customers via the Twilio integration.\n      ",
          excerpt:
            "Select a group of clients, choose the message type, and send a WhatsApp message or SMS using Twilio.",
          category: "Marketing",
          featured: true,
          tags: ["customer", "messaging", "twilio", "whatsapp"],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "6574245181cfbc23c4a28cb3",
          userPermissions: [],
          title: "Update Data",
          description:
            "Easily update your data directly from a table using a convenient modal interface.",
          appUrl:
            "https://app.appsmith.com/app/update-data/home-6568b337c114ef71003566d1?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/update-data.json",
          sortPriority: "0",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/test-building-blocks-update-data.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "TEXT_WIDGET",
            "IMAGE_WIDGET",
          ],
          functions: ["Building Blocks"],
          useCases: ["Productivity"],
          datasources: ["postgres-plugin"],
          pages: [
            {
              id: "6568b337c114ef71003566d1",
              name: "Home",
              slug: "home",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.9.12-SNAPSHOT",
          minVersionPadded: "000010000900012",
          downloadCount: 0,
          active: true,
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "655dbf1445ca324034a4ffd7",
          userPermissions: [],
          title: "Edit Data",
          description:
            "Effortlessly visualize your information in a convenient table format, and seamlessly engage in full-record editing right beside your table data.",
          appUrl:
            "https://app.appsmith.com/app/edit-data/home-6560703797f62254834ad917?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/edit-data.json",
          sortPriority: "0",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/test-building-blocks-view-data.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "TEXT_WIDGET",
            "IMAGE_WIDGET",
          ],
          functions: ["Building Blocks"],
          useCases: ["Productivity"],
          datasources: ["postgres-plugin"],
          pages: [
            {
              id: "6560703797f62254834ad917",
              name: "Home",
              slug: "home",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.9.12-SNAPSHOT",
          minVersionPadded: "000010000900012",
          downloadCount: 0,
          active: true,
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "65569fef4c25b34c355e55a2",
          userPermissions: [],
          title: "View Data",
          description:
            "Seamlessly toggle between a convenient table view and a detailed full-record display positioned right beside your table data.",
          appUrl:
            "https://app.appsmith.com/app/view-data/home-65606d7bcde8d74b0211609b?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/view-data.json",
          sortPriority: "0",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/test-building-block-icon.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "TEXT_WIDGET",
            "IMAGE_WIDGET",
          ],
          functions: ["Building Blocks"],
          useCases: ["Productivity"],
          datasources: ["postgres-plugin"],
          pages: [
            {
              id: "65606d7bcde8d74b0211609b",
              name: "Home",
              slug: "home",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.9.12-SNAPSHOT",
          minVersionPadded: "000010000900012",
          downloadCount: 0,
          active: true,
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f7f5d47a7d75706eb6ef9",
          userPermissions: [],
          title: "Business Directory with Clearbit API",
          description:
            "This app is used to manage and enrich the data of a company in a directory. Using the Clearbit Enrichment API, this app helps to look up a company’s domain, location, social handles and much more via a domain name.",
          appUrl:
            "https://app.appsmith.com/app/business-directory-with-clearbit-api/business-directory-62b15c9240b36d162478b56b?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/business-directory-with-clearbit-api.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/business-directory-with-clearbit-api.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "INPUT_WIDGET_V2",
            "TEXT_WIDGET",
            "ICON_BUTTON_WIDGET",
            "IMAGE_WIDGET",
            "MAP_WIDGET",
            "MODAL_WIDGET",
            "TABLE_WIDGET_V2",
          ],
          functions: ["Communications"],
          useCases: ["Marketing", "Communications"],
          datasources: ["postgres-plugin", "restapi-plugin"],
          pages: [
            {
              id: "62b15c9240b36d162478b56b",
              name: "Business directory",
              slug: "business-directory",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.5",
          minVersionPadded: "000010000700005",
          downloadCount: 0,
          active: true,
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f735947a7d75706eb6ef4",
          userPermissions: [],
          title: "Discord Bot for GitHub Updates",
          description:
            "This app, a Discord bot, helps users send new release updates to their server with a click of a button. The app uses the Discord webhook and GitHub API and users can preview the message and then send it to all their communities like a pro!",
          appUrl:
            "https://app.appsmith.com/app/discord-bot-for-github-updates/discord-bot-62b4b2de20ae3225cef16a51?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/discord-bot-for-github-updates.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/discord-bot-for-github-updates.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "CONTAINER_WIDGET",
            "TEXT_WIDGET",
            "ICON_BUTTON_WIDGET",
            "MODAL_WIDGET",
            "TABS_WIDGET",
          ],
          functions: ["Information Technology (IT)", "Communications"],
          useCases: ["Marketing", "Public Relations (PR)", "Communications"],
          datasources: ["restapi-plugin"],
          pages: [
            {
              id: "62b4b2de20ae3225cef16a51",
              name: "Discord Bot",
              slug: "discord-bot",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.5",
          minVersionPadded: "000010000700005",
          downloadCount: 0,
          active: true,
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "631f6eb447a7d75706eb6ed7",
          userPermissions: [],
          title: "Google Maps Navigation",
          description:
            "Guide your team with Google Maps directions, dynamically generated from your location or form a custom map pin added by the user.",
          appUrl:
            "https://app.appsmith.com/app/google-maps-navigation/directions-6269a377d8480440cf788b5c?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/google-maps-navigation.json",
          gifUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/maps_screenshot.png",
          sortPriority: "1000",
          screenshotUrls: [
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/maps_screenshot.png",
          ],
          widgets: [
            "BUTTON_WIDGET",
            "SELECT_WIDGET",
            "TEXT_WIDGET",
            "IMAGE_WIDGET",
            "MAP_WIDGET",
            "TABLE_WIDGET_V2",
          ],
          functions: ["Operations"],
          useCases: ["Marketing"],
          datasources: ["postgres-plugin", "restapi-plugin"],
          pages: [
            {
              id: "6269a377d8480440cf788b5c",
              name: "Directions",
              slug: "directions",
              isDefault: true,
              isHidden: false,
            },
          ],
          minVersion: "v1.7.1-SNAPSHOT",
          minVersionPadded: "000010000700001",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nSupporting a team of delivery drivers or techs working in the field can be challenging. Often times, there is a dispatcher or office admin that can help organize their travel plans and keep everyone updated.\n\nThis app uses Google Maps to generate driving directions based on your team's location so dispatchers and office admins can quickly send navigation links to their team.\n\n#### __Highlights of the app__\n- Users can select different team members to view their location on a map\n- Users can generate driving directions from their current location to the selected team member\n- Users can add a new map pin and generate driving directions from the team member to a custom location",
          excerpt:
            "An app to dynamically generate Google Maps directions from your location or from a custom map pin.",
          category: "Others",
          featured: true,
          tags: [
            "team management",
            "field support",
            "navigation",
            "driving directions",
            "Google Maps",
          ],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
        {
          id: "62221f5300c64549b31b9466",
          userPermissions: [],
          title: "Applicant Tracker-test",
          description:
            "Candidates can apply for jobs, and reviewers to review their applications, schedule interviews using the Google Calendar API, and give feedback to the candidate.",
          appUrl:
            "https://app.appsmith.com/app/applicant-tracker/1-track-applications-61c170fe9229e87746b79e0b?embed=true",
          appDataUrl:
            "https://s3.us-east-2.amazonaws.com/template.appsmith.com/applicant-tracker.json",
          gifUrl: "",
          sortPriority: "1000",
          screenshotUrls: [
            "https://assets.appsmith.com/templates/screenshots//ApplicantTarckerZoom.png",
          ],
          widgets: [],
          functions: [],
          useCases: ["Human Resources (HR)", "Personal", "Remote work"],
          datasources: [],
          pages: [
            {
              id: "61c170fe9229e87746b79e09",
              name: "2 Application Upload",
              slug: "2-application-upload",
              isDefault: false,
            },
            {
              id: "61c170fe9229e87746b79e0b",
              name: "1 Track Applications",
              slug: "1-track-applications",
              isDefault: true,
            },
          ],
          minVersion: "v1.6.11-SNAPSHOT",
          minVersionPadded: "000010000600011",
          downloadCount: 0,
          active: true,
          mdText:
            "### __Overview__\nJob-seeking and hiring for jobs are both complicated processes. It can become challenging to keep track of emails and follow up without a few applications falling through the cracks. A hiring management app strengthens recruiting processes. This hiring management template is a one-stop-shop for recruitment processes. A job seeker can send in a job application, reviewers and panelists can review the candidate's CV and qualifications, and then schedule an interview using Google Calendar API.\n\nIn this app, once an interview is scheduled, the job applicant can also give feedback to the recruiter using the link shared in the body of the invitation. This feedback page is also included in this application, where the interviewer can give their candid feedback and provide a rating to the candidate. The status can also reflect if the job applicant is getting placed or not.\n\nWith this actionable database of job applicants, communications about the interview outcome and communication regarding future openings become easy.\n\n#### __Highlights of the app__\n- Job applicants can fill in a job application, attach their CV, and fill in their personal and professional details.\n- When a candidate applies, they are added to a list of all applicants.\n- Users can view all applications and the associated information on the 'track applications' page. When a recruiter selects a user from this page, they can see their profile and adjust their status.\n- Applicants' interviews can be scheduled using the Google Calendar API.\n- After the interview, users can submit their feedback. It is accessible again on the track applications page when the feedback is received.",
          excerpt:
            "Review applications, schedule interviews using the Google Calendar API, & share interview feedback.",
          category: "Human Resources",
          featured: true,
          tags: [
            "hiring",
            "recruitment",
            "job application",
            "interview management",
            "feedback",
          ],
          allowPageImport: true,
          isCommunityTemplate: false,
          new: false,
        },
      ],
      similarTemplates: [],
      filters: {
        functions: ["All"],
      },
      allFilters: {
        userPermissions: [],
        sortPriority: "1000",
        widgets: [
          "List",
          "TEXT_WIDGET",
          "STATBOX_WIDGET",
          "LIST_WIDGET_V2",
          "Container",
          "MAP_WIDGET",
          "BUTTON_GROUP_WIDGET",
          "Text",
          "Form",
          "Icon Button",
          "ICON_BUTTON_WIDGET",
          "Modal",
          "Input",
          "Image",
          "JSON_FORM_WIDGET",
          "CHECKBOX_WIDGET",
          "TABLE_WIDGET",
          "IMAGE_WIDGET",
          "SELECT_WIDGET",
          "CURRENCY_INPUT_WIDGET",
          "TABS_WIDGET",
          "PHONE_INPUT_WIDGET",
          "DATE_PICKER_WIDGET2",
          "CHART_WIDGET",
          "Tabs",
          "BUTTON_WIDGET",
          "Button",
          "MODAL_WIDGET",
          "SWITCH_WIDGET",
          "DOCUMENT_VIEWER_WIDGET",
          "Select",
          "RICH_TEXT_EDITOR_WIDGET",
          "CONTAINER_WIDGET",
          "Table",
          "MULTI_SELECT_WIDGET_V2",
          "FORM_WIDGET",
          "TABLE_WIDGET_V2",
          "LIST_WIDGET",
          "INPUT_WIDGET_V2",
          "MENU_BUTTON_WIDGET",
          "RATE_WIDGET",
        ],
        functions: [
          "Customer Support",
          "Operations",
          "Start-up",
          "Other",
          "Information Technology (IT)",
          "Services",
          "Building Blocks",
          "Technology",
          "Human Resources",
          "Communications",
          "Building Block",
          "Sales",
          "Customer management",
          "Marketing",
          "E-Commerce",
          "Consumer goods",
          "All",
        ],
        useCases: [
          "Finance",
          "Personal",
          "Marketing",
          "Project Management",
          "Remote Work",
          "Support",
          "Sales",
          "Admin",
          "Software Development",
          "Productivity",
          "Communications",
          "Human Resources (HR)",
          "Human Resources",
          "Remote work",
          "Public Relations (PR)",
        ],
        datasources: [
          "restapi-plugin",
          "61531b1b9370f312a0394f16",
          "twilio",
          "smtp-plugin",
          "Google Sheets",
          "postgres-plugin",
          "mongo-plugin",
        ],
        new: true,
      },
      templateSearchQuery: "",
      templateNotificationSeen: null,
      templatesModal: {
        isOpen: false,
        isOpenFromCanvas: false,
      },
    },
    workspaces: {
      loadingStates: {
        isFetchAllRoles: false,
        isFetchAllUsers: false,
        isFetchingWorkspace: false,
      },
      workspaceUsers: [
        {
          userId: "659d2e14d0cbfb0c5e0a7422",
          username: "jacques@adasdsad.com",
          name: "jacques",
          roles: [
            {
              id: "659d2e14d0cbfb0c5e0a7425",
              name: "Administrator - jacques's apps",
              description:
                "Can modify all workspace settings including editing applications, inviting other users to the workspace and exporting applications from the workspace",
              entityType: "Workspace",
            },
          ],
          isDeleting: false,
          isChangingRole: false,
        },
      ],
      workspaceRoles: [],
      currentWorkspace: {
        id: "659d2e14d0cbfb0c5e0a7424",
        userPermissions: [
          "publish:workspaceApplications",
          "delete:workspace",
          "manage:workspaceApplications",
          "delete:workspaceDatasources",
          "export:workspaceApplications",
          "read:workspaceDatasources",
          "read:workspaceApplications",
          "inviteUsers:workspace",
          "read:workspaces",
          "manage:workspaceDatasources",
          "create:datasources",
          "delete:workspaceApplications",
          "create:applications",
          "manage:workspaces",
        ],
        name: "jacques's apps",
        email: "jacques@adasdsad.com",
        plugins: [
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b5c",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b5b",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236225e9a6424e4c04b75",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b5a",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "6572a3933efa034a885f73bf",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b59",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b64",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b63",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b62",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236225e9a6424e4c04b74",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b58",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236205e9a6424e4c04b51",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "6597efc7d0cbfb0c5e0a73cc",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "654a489144e16d2e57f05d60",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b61",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "6597efc7d0cbfb0c5e0a73ce",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b55",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236205e9a6424e4c04b52",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236465e9a6424e4c04b77",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "6597efc7d0cbfb0c5e0a73cd",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236205e9a6424e4c04b53",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236465e9a6424e4c04b78",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b5f",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236465e9a6424e4c04b79",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b5e",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236215e9a6424e4c04b5d",
            status: "FREE",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236465e9a6424e4c04b77",
            status: "ACTIVATED",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236465e9a6424e4c04b78",
            status: "ACTIVATED",
            new: true,
          },
          {
            userPermissions: [],
            pluginId: "653236465e9a6424e4c04b79",
            status: "ACTIVATED",
            new: true,
          },
        ],
        slug: "jacques-s-apps",
        isAutoGeneratedWorkspace: true,
        organizationId: "653236225e9a6424e4c04b65",
        logoUrl: "/api/v1/assets/null",
        new: false,
      },
    },
    users: {
      loadingStates: {
        fetchingUsers: false,
        fetchingUser: false,
      },
      list: [],
      users: [
        {
          email: "jacques@adasdsad.com",
          username: "jacques@adasdsad.com",
          useCase: "personal project",
          enableTelemetry: true,
          roles: [
            "Upgrade to business plan to access roles and groups for conditional business logic",
          ],
          groups: [
            "Upgrade to business plan to access roles and groups for conditional business logic",
          ],
          emptyInstance: false,
          accountNonExpired: true,
          accountNonLocked: true,
          credentialsNonExpired: true,
          isAnonymous: false,
          isEnabled: true,
          isSuperUser: false,
          isConfigurable: true,
          adminSettingsVisible: false,
          isIntercomConsentGiven: false,
        },
      ],
      error: "",
      currentUser: {
        email: "jacques@adasdsad.com",
        username: "jacques@adasdsad.com",
        useCase: "personal project",
        enableTelemetry: true,
        roles: [
          "Upgrade to business plan to access roles and groups for conditional business logic",
        ],
        groups: [
          "Upgrade to business plan to access roles and groups for conditional business logic",
        ],
        emptyInstance: false,
        accountNonExpired: true,
        accountNonLocked: true,
        credentialsNonExpired: true,
        isAnonymous: false,
        isEnabled: true,
        isSuperUser: false,
        isConfigurable: true,
        adminSettingsVisible: false,
        isIntercomConsentGiven: false,
      },
      featureFlag: {
        data: {
          TEST_FLAG: true,
          release_datasource_environments_enabled: false,
          release_appnavigationlogoupload_enabled: false,
          release_embed_hide_share_settings_enabled: false,
          release_table_serverside_filtering_enabled: false,
          license_branding_enabled: false,
          license_sso_saml_enabled: false,
          license_sso_oidc_enabled: false,
          license_private_embeds_enabled: false,
          release_show_publish_app_to_community_enabled: false,
          license_gac_enabled: false,
          release_anvil_enabled: false,
          release_app_sidebar_enabled: false,
          license_git_branch_protection_enabled: false,
          license_widget_rtl_support_enabled: false,
          release_show_new_sidebar_announcement_enabled: false,
          rollout_app_sidebar_enabled: false,
          ab_one_click_learning_popover_enabled: false,
          license_git_unlimited_repo_enabled: false,
          ask_ai_js: false,
          license_connection_pool_size_enabled: false,
          ab_ai_js_function_completion_enabled: true,
          release_workflows_enabled: false,
          license_scim_enabled: false,
          ask_ai: false,
          license_audit_logs_enabled: false,
          ask_ai_sql: false,
          release_query_module_enabled: false,
          ab_onboarding_flow_start_with_data_dev_only_enabled: false,
          license_session_limit_enabled: false,
          rollout_datasource_test_rate_limit_enabled: false,
          license_scheduled_backup_enabled: false,
          ab_ai_button_sql_enabled: true,
          license_message_listener_enabled: false,
          license_custom_environments_enabled: false,
          license_pac_enabled: false,
          ab_gif_signposting_enabled: false,
          ab_env_walkthrough_enabled: false,
          release_knowledge_base_enabled: false,
          release_git_branch_protection_enabled: false,
        },
        isFetched: true,
        isFetching: false,
      },
      productAlert: {
        config: {
          dismissed: false,
          snoozeTill: "2024-01-11T21:24:18.502Z",
        },
      },
    },
    widgetDragResize: {
      isDragging: false,
      dragDetails: {},
      autoLayoutDragDetails: {},
      isResizing: false,
      lastSelectedWidget: "0",
      selectedWidgets: [],
      focusedWidget: "30s2xz9lqx",
      selectedWidgetAncestry: [],
      entityExplorerAncestry: [],
      isAutoCanvasResizing: false,
      anvil: {
        isDistributingSpace: false,
      },
      isDraggingDisabled: false,
    },
    importedCollections: {
      isFetchingImportedCollections: false,
      importedCollections: [],
    },
    imports: {
      isImportingCurl: false,
      errorPayload: {},
    },
    queryPane: {
      isFetching: false,
      isCreating: false,
      isRunning: {},
      isSaving: {},
      isDeleting: {},
      runErrorMessage: {},
      lastUsed: "",
      responseTabHeight: 351.6,
      selectedConfigTabIndex: "0",
    },
    datasourcePane: {
      drafts: {},
      actionRouteInfo: {},
      expandDatasourceId: "",
      newDatasource: "",
      viewMode: true,
      collapsibleState: {},
      defaultKeyValueArrayConfig: [],
      responseTabHeight: 351.6,
    },
    datasourceName: {
      isSaving: {},
      errors: {},
    },
    help: {
      url: "",
      modalOpen: false,
      defaultRefinement: "",
    },
    apiName: {
      isSaving: {},
      errors: {},
    },
    explorer: {
      pinnedState: 0,
      entity: {},
      width: 256,
      active: true,
      entityInfo: {
        show: false,
      },
    },
    pageCanvasStructure: {
      "659f81c8d0cbfb0c5e0a743b": {
        widgetId: "0",
        widgetName: "MainContainer",
        type: "CANVAS_WIDGET",
        children: [
          {
            widgetId: "76t6mkfckv",
            widgetName: "txt_pageTitle",
            type: "TEXT_WIDGET",
          },
          {
            widgetId: "30s2xz9lqx",
            widgetName: "tbl_userInfo",
            type: "TABLE_WIDGET_V2",
          },
          {
            widgetId: "gz1wda6co5",
            widgetName: "con_userDetails",
            type: "FORM_WIDGET",
            children: [
              {
                widgetId: "ksqoq712gb",
                widgetName: "txt_userFullName",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "2xoes8wilz",
                widgetName: "txt_countryValue",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "av2rmb7w6k",
                widgetName: "txt_updatedAtValue",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "49fw3yiijl",
                widgetName: "txt_createdAtValue",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "yrnf6ebevh",
                widgetName: "txt_longitudeValue",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "z5vabtkhbb",
                widgetName: "txt_latitudeValue",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "308vo9jh63",
                widgetName: "txt_phoneValue",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "5qcop7cwtm",
                widgetName: "txt_dobValue",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "oid24ma9vw",
                widgetName: "txt_genderValue",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "y4kqr6s084",
                widgetName: "txt_userEmail",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "u753uo6af8",
                widgetName: "txt_country",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "gsgr0ynhbb",
                widgetName: "txt_updatedAt",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "3etip5rg1a",
                widgetName: "txt_createdAt",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "81esy5jfi0",
                widgetName: "txt_longitude",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "z5j3zsmu38",
                widgetName: "txt_latitude",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "v03001ino4",
                widgetName: "txt_phone",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "z434i5dlb7",
                widgetName: "txt_dob",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "4hqs7tr225",
                widgetName: "txt_gender",
                type: "TEXT_WIDGET",
              },
              {
                widgetId: "6st25auvr3",
                widgetName: "div_detailDivider",
                type: "DIVIDER_WIDGET",
              },
              {
                widgetId: "jf6mghk92c",
                widgetName: "img_userImage",
                type: "IMAGE_WIDGET",
              },
            ],
          },
        ],
      },
    },
    pageWidgets: {
      "659f81c8d0cbfb0c5e0a743b": {
        dsl: {
          "0": {
            widgetName: "MainContainer",
            backgroundColor: "none",
            rightColumn: 4896,
            snapColumns: 64,
            detachFromLayout: true,
            widgetId: "0",
            topRow: 0,
            bottomRow: 640,
            containerStyle: "none",
            snapRows: 124,
            parentRowSpace: 1,
            type: "CANVAS_WIDGET",
            canExtend: true,
            version: 87,
            minHeight: 1292,
            dynamicTriggerPathList: [],
            parentColumnSpace: 1,
            dynamicBindingPathList: [],
            leftColumn: 0,
            children: ["76t6mkfckv", "30s2xz9lqx", "gz1wda6co5"],
          },
          "76t6mkfckv": {
            mobileBottomRow: 5,
            widgetName: "txt_pageTitle",
            displayName: "Text",
            iconSVG: "/static/media/icon.c3b6033f570046f8c6288d911333a827.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 1,
            bottomRow: 5,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 30,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 6.42333984375,
            dynamicTriggerPathList: [],
            leftColumn: 1,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "borderRadius",
              },
              {
                key: "fontFamily",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "Customer Information",
            key: "ph5glqkph7",
            isDeprecated: false,
            rightColumn: 22,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "76t6mkfckv",
            minWidth: 450,
            isVisible: true,
            fontStyle: "BOLD",
            textColor: "#101828",
            version: 1,
            parentId: "0",
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 1,
            responsiveBehavior: "fill",
            originalTopRow: 1,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 14,
            maxDynamicHeight: 9000,
            originalBottomRow: 5,
            fontSize: "1.25rem",
            minDynamicHeight: 4,
          },
          "30s2xz9lqx": {
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            borderColor: "#E0DEDE",
            isVisibleDownload: true,
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.e6911f8bb94dc6c4a102a74740c41763.svg",
            topRow: 6,
            isSortable: true,
            type: "TABLE_WIDGET_V2",
            inlineEditingSaveOption: "ROW_LEVEL",
            animateLoading: true,
            dynamicBindingPathList: [
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
                key: "primaryColumns.id.computedValue",
              },
              {
                key: "primaryColumns.gender.computedValue",
              },
              {
                key: "primaryColumns.latitude.computedValue",
              },
              {
                key: "primaryColumns.longitude.computedValue",
              },
              {
                key: "primaryColumns.dob.computedValue",
              },
              {
                key: "primaryColumns.phone.computedValue",
              },
              {
                key: "primaryColumns.email.computedValue",
              },
              {
                key: "primaryColumns.image.computedValue",
              },
              {
                key: "primaryColumns.country.computedValue",
              },
              {
                key: "primaryColumns.name.computedValue",
              },
              {
                key: "primaryColumns.created_at.computedValue",
              },
              {
                key: "primaryColumns.updated_at.computedValue",
              },
              {
                key: "tableData",
              },
            ],
            needsHeightForContent: true,
            leftColumn: 1,
            delimiter: ",",
            defaultSelectedRowIndex: 0,
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            isVisibleFilters: true,
            isVisible: true,
            enableClientSideSearch: true,
            version: 2,
            totalRecordsCount: 0,
            tags: ["Suggested", "Display"],
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
                saveBorderRadius:
                  "{{appsmith.theme.borderRadius.appBorderRadius}}",
                discardButtonColor: "{{appsmith.theme.colors.primaryColor}}",
                discardBorderRadius:
                  "{{appsmith.theme.borderRadius.appBorderRadius}}",
              },
            },
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            columnUpdatedAt: 1699355743847,
            originalBottomRow: 59,
            defaultSelectedRowIndices: [0],
            mobileBottomRow: 45,
            widgetName: "tbl_userInfo",
            defaultPageSize: 0,
            columnOrder: [
              "image",
              "name",
              "email",
              "phone",
              "id",
              "gender",
              "latitude",
              "longitude",
              "dob",
              "country",
              "created_at",
              "updated_at",
            ],
            dynamicPropertyPathList: [],
            displayName: "Table",
            bottomRow: 64,
            columnWidthMap: {
              id: 94,
              gender: 115,
              image: 85,
              name: 161,
            },
            parentRowSpace: 10,
            hideCard: false,
            mobileRightColumn: 35,
            parentColumnSpace: 18.880859375,
            dynamicTriggerPathList: [],
            borderWidth: "",
            primaryColumns: {
              id: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 0,
                width: 150,
                originalId: "id",
                id: "id",
                alias: "id",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "number",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: false,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "id",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["id"]))}}',
                sticky: "",
                validation: {},
              },
              gender: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 1,
                width: 150,
                originalId: "gender",
                id: "gender",
                alias: "gender",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "text",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: true,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "gender",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["gender"]))}}',
                sticky: "",
                validation: {},
              },
              latitude: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 2,
                width: 150,
                originalId: "latitude",
                id: "latitude",
                alias: "latitude",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "text",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: false,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "latitude",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["latitude"]))}}',
                sticky: "",
                validation: {},
              },
              longitude: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 3,
                width: 150,
                originalId: "longitude",
                id: "longitude",
                alias: "longitude",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "text",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: false,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "longitude",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["longitude"]))}}',
                sticky: "",
                validation: {},
              },
              dob: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 4,
                width: 150,
                originalId: "dob",
                id: "dob",
                alias: "dob",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "date",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: true,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "dob",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["dob"]))}}',
                sticky: "",
                validation: {},
                outputFormat: "DD/MM/YYYY",
              },
              phone: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 5,
                width: 150,
                originalId: "phone",
                id: "phone",
                alias: "phone",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "text",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: true,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "phone",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["phone"]))}}',
                sticky: "",
                validation: {},
              },
              email: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 6,
                width: 150,
                originalId: "email",
                id: "email",
                alias: "email",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "text",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: true,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "email",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["email"]))}}',
                sticky: "",
                validation: {},
              },
              image: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 7,
                width: 150,
                originalId: "image",
                id: "image",
                alias: "image",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "image",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: false,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "image",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["image"]))}}',
                sticky: "",
                validation: {},
              },
              country: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 8,
                width: 150,
                originalId: "country",
                id: "country",
                alias: "country",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "text",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: true,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "country",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["country"]))}}',
                sticky: "",
                validation: {},
              },
              name: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 9,
                width: 150,
                originalId: "name",
                id: "name",
                alias: "name",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "text",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: true,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "name",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["name"]))}}',
                sticky: "",
                validation: {},
              },
              created_at: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 10,
                width: 150,
                originalId: "created_at",
                id: "created_at",
                alias: "created_at",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "text",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: false,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "created_at",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["created_at"]))}}',
                sticky: "",
                validation: {},
              },
              updated_at: {
                allowCellWrapping: false,
                allowSameOptionsInNewRow: true,
                index: 11,
                width: 150,
                originalId: "updated_at",
                id: "updated_at",
                alias: "updated_at",
                horizontalAlignment: "LEFT",
                verticalAlignment: "CENTER",
                columnType: "text",
                textSize: "0.875rem",
                enableFilter: true,
                enableSort: true,
                isVisible: false,
                isDisabled: false,
                isCellEditable: false,
                isEditable: false,
                isCellVisible: true,
                isDerived: false,
                label: "updated_at",
                isSaveVisible: true,
                isDiscardVisible: true,
                computedValue:
                  '{{tbl_userInfo.processedTableData.map((currentRow, currentIndex) => ( currentRow["updated_at"]))}}',
                sticky: "",
                validation: {},
              },
            },
            key: "1hz6z5p49i",
            canFreezeColumn: true,
            isDeprecated: false,
            rightColumn: 41,
            textSize: "0.875rem",
            widgetId: "30s2xz9lqx",
            enableServerSideFiltering: false,
            minWidth: 450,
            tableData: "{{getUsers.data}}",
            label: "Data",
            searchKey: "",
            parentId: "0",
            renderMode: "CANVAS",
            mobileTopRow: 17,
            horizontalAlignment: "LEFT",
            isVisibleSearch: true,
            responsiveBehavior: "fill",
            originalTopRow: 17,
            mobileLeftColumn: 1,
            isVisiblePagination: true,
            verticalAlignment: "CENTER",
          },
          ksqoq712gb: {
            widgetName: "txt_userFullName",
            displayName: "Text",
            iconSVG: "/static/media/icon.97c59b523e6f70ba6f40a10fc2c7c5b5.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 2,
            bottomRow: 6,
            type: "TEXT_WIDGET",
            hideCard: false,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            dynamicTriggerPathList: [],
            leftColumn: 18,
            dynamicBindingPathList: [
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "#FFC13D",
            text: "{{tbl_userInfo.selectedRow.name}}",
            key: "799bmivq9p",
            isDeprecated: false,
            rightColumn: 60,
            textAlign: "LEFT",
            dynamicHeight: "FIXED",
            widgetId: "ksqoq712gb",
            isVisible: true,
            fontStyle: "BOLD",
            textColor: "#231F20",
            version: 1,
            parentId: "1c72qpylh0",
            renderMode: "CANVAS",
            isLoading: false,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            maxDynamicHeight: 9000,
            fontSize: "1.25rem",
            minDynamicHeight: 4,
          },
          "2xoes8wilz": {
            mobileBottomRow: 9,
            widgetName: "txt_countryValue",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 30,
            bottomRow: 34,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 25,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "{{tbl_userInfo.selectedRow.country}}",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 62,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "2xoes8wilz",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#101828",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 30,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 34,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          av2rmb7w6k: {
            mobileBottomRow: 9,
            widgetName: "txt_updatedAtValue",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 50,
            bottomRow: 54,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 25,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "{{new Date(tbl_userInfo.selectedRow.updated_at).toDateString()}}",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 62,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "av2rmb7w6k",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#101828",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 50,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 54,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          "49fw3yiijl": {
            mobileBottomRow: 9,
            widgetName: "txt_createdAtValue",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 45,
            bottomRow: 49,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 25,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "{{new Date(tbl_userInfo.selectedRow.created_at).toDateString()}}",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 62,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "49fw3yiijl",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#101828",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 45,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 49,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          yrnf6ebevh: {
            mobileBottomRow: 9,
            widgetName: "txt_longitudeValue",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 40,
            bottomRow: 44,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 25,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "{{tbl_userInfo.selectedRow.longitude}}",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 62,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "yrnf6ebevh",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#101828",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 40,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 44,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          z5vabtkhbb: {
            mobileBottomRow: 9,
            widgetName: "txt_latitudeValue",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 35,
            bottomRow: 39,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 25,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "{{tbl_userInfo.selectedRow.latitude}}",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 62,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "z5vabtkhbb",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#101828",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 35,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 39,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          "308vo9jh63": {
            mobileBottomRow: 9,
            widgetName: "txt_phoneValue",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 25,
            bottomRow: 29,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 25,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "{{tbl_userInfo.selectedRow.phone}}",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 62,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "308vo9jh63",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#101828",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 25,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 29,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          "5qcop7cwtm": {
            mobileBottomRow: 9,
            widgetName: "txt_dobValue",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 19,
            bottomRow: 23,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 25,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "{{new Date(tbl_userInfo.selectedRow.dob).toDateString()}}",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 62,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "5qcop7cwtm",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#101828",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 19,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 24,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          oid24ma9vw: {
            mobileBottomRow: 9,
            widgetName: "txt_genderValue",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 14,
            bottomRow: 18,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 25,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "{{tbl_userInfo.selectedRow.gender}}",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 62,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "oid24ma9vw",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#101828",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 22,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 26,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          y4kqr6s084: {
            mobileBottomRow: 9,
            widgetName: "txt_userEmail",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 6,
            bottomRow: 10,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 18,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
              {
                key: "text",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "{{tbl_userInfo.selectedRow.email}}",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 61,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "y4kqr6s084",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#101828",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 6,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 11,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          u753uo6af8: {
            mobileBottomRow: 9,
            widgetName: "txt_country",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 30,
            bottomRow: 34,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 2,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "Country",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 25,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "u753uo6af8",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#71717a",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 34,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 38,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          gsgr0ynhbb: {
            mobileBottomRow: 9,
            widgetName: "txt_updatedAt",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 50,
            bottomRow: 54,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 2,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "Updated at",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 25,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "gsgr0ynhbb",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#71717a",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 34,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 38,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          "3etip5rg1a": {
            mobileBottomRow: 9,
            widgetName: "txt_createdAt",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 45,
            bottomRow: 49,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 2,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "Created at",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 25,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "3etip5rg1a",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#71717a",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 34,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 38,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          "81esy5jfi0": {
            mobileBottomRow: 9,
            widgetName: "txt_longitude",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 40,
            bottomRow: 44,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 2,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "Longitude",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 25,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "81esy5jfi0",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#71717a",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 34,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 38,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          z5j3zsmu38: {
            mobileBottomRow: 9,
            widgetName: "txt_latitude",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 35,
            bottomRow: 39,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 2,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "Latitude",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 25,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "z5j3zsmu38",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#71717a",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 34,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 38,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          v03001ino4: {
            mobileBottomRow: 9,
            widgetName: "txt_phone",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 25,
            bottomRow: 29,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 2,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "Phone Number",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 25,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "v03001ino4",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#71717a",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 29,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 33,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          z434i5dlb7: {
            mobileBottomRow: 9,
            widgetName: "txt_dob",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 19,
            bottomRow: 23,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 2,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "Date of Birth",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 25,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "z434i5dlb7",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#71717a",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 25,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 29,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          "4hqs7tr225": {
            mobileBottomRow: 9,
            widgetName: "txt_gender",
            displayName: "Text",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.a47d6d5dbbb718c4dc4b2eb4f218c1b7.svg",
            searchTags: ["typography", "paragraph", "label"],
            topRow: 14,
            bottomRow: 18,
            parentRowSpace: 10,
            type: "TEXT_WIDGET",
            hideCard: false,
            mobileRightColumn: 18,
            animateLoading: true,
            overflow: "NONE",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 2,
            dynamicBindingPathList: [
              {
                key: "truncateButtonColor",
              },
              {
                key: "fontFamily",
              },
              {
                key: "borderRadius",
              },
            ],
            shouldTruncate: false,
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            text: "Gender",
            key: "jl31nlbh5s",
            isDeprecated: false,
            rightColumn: 25,
            textAlign: "LEFT",
            dynamicHeight: "AUTO_HEIGHT",
            widgetId: "4hqs7tr225",
            minWidth: 450,
            isVisible: true,
            fontStyle: "",
            textColor: "#71717a",
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Suggested", "Content"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 5,
            responsiveBehavior: "fill",
            originalTopRow: 21,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 2,
            maxDynamicHeight: 9000,
            originalBottomRow: 25,
            fontSize: "1rem",
            minDynamicHeight: 4,
          },
          "6st25auvr3": {
            mobileBottomRow: 8,
            widgetName: "div_detailDivider",
            thickness: 2,
            displayName: "Divider",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.3b7d47d7bd70da418a827287042cbb7f.svg",
            searchTags: ["line"],
            topRow: 10,
            bottomRow: 14,
            parentRowSpace: 10,
            type: "DIVIDER_WIDGET",
            capType: "nc",
            hideCard: false,
            mobileRightColumn: 38,
            animateLoading: true,
            parentColumnSpace: 5.5732421875,
            dynamicTriggerPathList: [],
            leftColumn: 2,
            dynamicBindingPathList: [],
            key: "e0sxfu5i3g",
            dividerColor: "#f4f4f5",
            orientation: "horizontal",
            strokeStyle: "solid",
            isDeprecated: false,
            rightColumn: 61,
            widgetId: "6st25auvr3",
            capSide: 0,
            minWidth: 450,
            isVisible: true,
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Layout"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 4,
            responsiveBehavior: "fill",
            originalTopRow: 12,
            mobileLeftColumn: 18,
            originalBottomRow: 16,
          },
          jf6mghk92c: {
            boxShadow: "none",
            mobileBottomRow: 13,
            widgetName: "img_userImage",
            displayName: "Image",
            iconSVG:
              "https://appcdn.appsmith.com/static/media/icon.69b0f0dd810281fbd6e34fc2c3f39344.svg",
            topRow: 1,
            bottomRow: 10,
            parentRowSpace: 10,
            type: "IMAGE_WIDGET",
            hideCard: false,
            mobileRightColumn: 11,
            animateLoading: true,
            parentColumnSpace: 5.56884765625,
            dynamicTriggerPathList: [],
            imageShape: "RECTANGLE",
            leftColumn: 2,
            dynamicBindingPathList: [
              {
                key: "borderRadius",
              },
              {
                key: "image",
              },
            ],
            defaultImage: "https://assets.appsmith.com/widgets/default.png",
            key: "0pndua8j2k",
            image: "{{tbl_userInfo.selectedRow.image}}",
            isDeprecated: false,
            rightColumn: 18,
            objectFit: "contain",
            widgetId: "jf6mghk92c",
            isVisible: true,
            version: 1,
            parentId: "1c72qpylh0",
            tags: ["Media"],
            renderMode: "CANVAS",
            isLoading: false,
            mobileTopRow: 1,
            maxZoomLevel: 1,
            enableDownload: false,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            mobileLeftColumn: 0,
            enableRotation: false,
          },
          "1c72qpylh0": {
            boxShadow: "none",
            widgetName: "Canvas4CopyCopy",
            displayName: "Canvas",
            topRow: 0,
            bottomRow: 580,
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
              "ksqoq712gb",
              "2xoes8wilz",
              "av2rmb7w6k",
              "49fw3yiijl",
              "yrnf6ebevh",
              "z5vabtkhbb",
              "308vo9jh63",
              "5qcop7cwtm",
              "oid24ma9vw",
              "y4kqr6s084",
              "u753uo6af8",
              "gsgr0ynhbb",
              "3etip5rg1a",
              "81esy5jfi0",
              "z5j3zsmu38",
              "v03001ino4",
              "z434i5dlb7",
              "4hqs7tr225",
              "6st25auvr3",
              "jf6mghk92c",
            ],
            key: "tju5wikk1m",
            isDeprecated: false,
            rightColumn: 436.5,
            detachFromLayout: true,
            widgetId: "1c72qpylh0",
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            containerStyle: "none",
            isVisible: true,
            version: 1,
            parentId: "gz1wda6co5",
            renderMode: "CANVAS",
            isLoading: false,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          gz1wda6co5: {
            boxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            widgetName: "con_userDetails",
            isCanvas: true,
            displayName: "Form",
            iconSVG: "/static/media/icon.ea3e08d130e59c56867ae40114c10eed.svg",
            searchTags: ["group"],
            topRow: 6,
            bottomRow: 64,
            parentRowSpace: 10,
            type: "FORM_WIDGET",
            hideCard: false,
            shouldScrollContents: true,
            animateLoading: true,
            parentColumnSpace: 18.1875,
            dynamicTriggerPathList: [],
            leftColumn: 41,
            dynamicBindingPathList: [
              {
                key: "borderRadius",
              },
            ],
            children: ["1c72qpylh0"],
            key: "b2g4hzss2y",
            backgroundColor: "#FFFFFF",
            isDeprecated: false,
            rightColumn: 63,
            dynamicHeight: "FIXED",
            widgetId: "gz1wda6co5",
            isVisible: true,
            parentId: "0",
            renderMode: "CANVAS",
            isLoading: false,
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            maxDynamicHeight: 9000,
            minDynamicHeight: 10,
          },
        },
        layoutId: "659f81c8d0cbfb0c5e0a743a",
      },
    },
    theme: {
      mode: "LIGHT",
      theme: {
        radii: [0, 4, 8, 10, 20, 50],
        fontSizes: [0, 10, 12, 14, 16, 18, 24, 28, 32, 48, 64],
        spaces: [
          0, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 30, 36, 38, 40, 42, 44,
        ],
        fontWeights: [0, 400, 500, 700],
        typography: {
          h1: {
            fontSize: 20,
            lineHeight: 27,
            letterSpacing: -0.204,
            fontWeight: 500,
          },
          h2: {
            fontSize: 18,
            lineHeight: 25,
            letterSpacing: -0.204,
            fontWeight: 500,
          },
          h3: {
            fontSize: 17,
            lineHeight: 22,
            letterSpacing: -0.204,
            fontWeight: 500,
          },
          h4: {
            fontSize: 16,
            lineHeight: 21,
            letterSpacing: -0.24,
            fontWeight: 500,
          },
          h5: {
            fontSize: 14,
            lineHeight: 19,
            letterSpacing: -0.24,
            fontWeight: 500,
          },
          h6: {
            fontSize: 12,
            lineHeight: 14,
            letterSpacing: 0.8,
            fontWeight: 500,
          },
          p0: {
            fontSize: 16,
            lineHeight: 20,
            letterSpacing: -0.24,
            fontWeight: 500,
          },
          p1: {
            fontSize: 14,
            lineHeight: 19,
            letterSpacing: -0.24,
            fontWeight: "normal",
          },
          p2: {
            fontSize: 13,
            lineHeight: 17,
            letterSpacing: -0.24,
            fontWeight: "normal",
          },
          p3: {
            fontSize: 12,
            lineHeight: 16,
            letterSpacing: -0.221538,
            fontWeight: "normal",
          },
          p4: {
            fontSize: 13,
            lineHeight: 16,
            letterSpacing: -0.221538,
            fontWeight: 600,
          },
          btnLarge: {
            fontSize: 13,
            lineHeight: 15,
            letterSpacing: 0.6,
            fontWeight: 600,
          },
          btnMedium: {
            fontSize: 12,
            lineHeight: 14,
            letterSpacing: 0.6,
            fontWeight: 600,
          },
          btnSmall: {
            fontSize: 11,
            lineHeight: 12,
            letterSpacing: 0.4,
            fontWeight: 600,
          },
          floatingBtn: {
            fontSize: 14,
            lineHeight: 17,
            letterSpacing: -0.24,
            fontWeight: "normal",
          },
          releaseList: {
            fontSize: 14,
            lineHeight: 23,
            letterSpacing: -0.24,
            fontWeight: "normal",
          },
          cardHeader: {
            fontStyle: "normal",
            fontWeight: 600,
            fontSize: 25,
            lineHeight: 20,
          },
          cardSubheader: {
            fontStyle: "normal",
            fontWeight: "normal",
            fontSize: 15,
            lineHeight: 20,
          },
          largeH1: {
            fontStyle: "normal",
            fontWeight: "bold",
            fontSize: 28,
            lineHeight: 36,
          },
          docHeader: {
            fontStyle: "normal",
            fontWeight: "bold",
            fontSize: 17,
          },
          spacedOutP1: {
            fontStyle: "normal",
            fontWeight: "normal",
            fontSize: 14,
            lineHeight: 24,
          },
          categoryBtn: {
            fontSize: 12,
            lineHeight: 14,
            letterSpacing: 0.2,
            fontWeight: 500,
          },
          sideHeading: {
            fontStyle: "normal",
            fontWeight: "bold",
            fontSize: 13,
          },
          u1: {
            fontStyle: "normal",
            fontWeight: 600,
            fontSize: 14,
            lineHeight: 17,
          },
          u2: {
            fontSize: 10,
            fontStyle: "normal",
            fontWeight: 600,
            lineHeight: 12,
          },
          dangerHeading: {
            fontStyle: "normal",
            fontWeight: 500,
            fontSize: 24,
            lineHeight: 28,
            letterSpacing: -0.24,
          },
        },
        iconSizes: {
          XXS: 8,
          XS: 10,
          SMALL: 12,
          MEDIUM: 14,
          LARGE: 15,
          XL: 16,
          XXL: 18,
          XXXL: 20,
          XXXXL: 22,
        },
        propertyPane: {
          width: 270,
          titleHeight: 40,
          connectionsHeight: 30,
          height: 600,
          dividerColor: "#464D53",
        },
        evaluatedValuePopup: {
          width: 300,
          height: 500,
        },
        drawerWidth: "80%",
        colors: {
          tooltip: {
            lightBg: "#FAFAFA",
            lightText: "#090707",
            darkBg: "#090707",
            darkText: "#FAFAFA",
          },
          appBackground: "#EDEDED",
          artboard: "#F8FAFC",
          primaryOld: "#03B365",
          primaryDarker: "#24BA91",
          primaryDarkest: "#30A481",
          secondary: "#E7E7E7",
          secondaryDarker: "#F3F3F3",
          secondaryDarkest: "#E8E8E8",
          error: "#E22C2C",
          infoOld: "#768896",
          errorMessage: "#E22C2C",
          hover: "#E9FAF3",
          inputActiveBorder: "#A1ACB3",
          inputInactiveBG: "#EEF2F5",
          textDefault: "#040627",
          textOnDarkBG: "#FFFFFF",
          textOnGreyBG: "#4B4848",
          textOnWhiteBG: "#090707",
          textAnchor: "#6871EF",
          border: "#D3DEE3",
          paneCard: "#21282C",
          paneInputBG: "#21282C",
          paneBG: "#363E44",
          paneText: "#A2A6A8",
          paneTextBG: "#272E32",
          paneTextUnderline: "#B0BFCB",
          paneSectionLabel: "#A3B3BF",
          navBG: "#21282C",
          grid: "#E0DEDE",
          containerBorder: "#BBE8FE",
          menuButtonBGInactive: "#BCCCD9",
          menuIconColorInactive: "#2E3D49",
          bodyBG: "#EBEFF2",
          builderBodyBG: "#FFFFFF",
          widgetMultiSelectBorder: "#7DBCFF",
          widgetBorder: "#768896",
          widgetLightBorder: "#F4F4F4",
          widgetSecondaryBorder: "#E8E8E8",
          messageBG: "#F3F3F3",
          paneIcon: "#4C565E",
          bindingTextDark: "#ffcc99",
          bindingText: "#063289",
          cmBacground: "#23292E",
          lightningborder: "#F9F8F8",
          formButtonColor: "#FFFFFF",
          appCardColors: [
            "#FFEFDB",
            "#D9E7FF",
            "#FFDEDE",
            "#E3DEFF",
            "#C7F3E3",
            "#F1DEFF",
            "#F4FFDE",
            "#C7F3F0",
            "#C2DAF0",
            "#F5D1D1",
            "#ECECEC",
            "#CCCCCC",
            "#F3F1C7",
            "#E4D8CC",
            "#EAEDFB",
            "#D6D1F2",
            "#FBF4ED",
            "#FFEBFB",
          ],
          dataTypeBg: {
            function: "#BDB2FF",
            object: "#FFD6A5",
            unknown: "#4bb",
            array: "#CDFFA5",
            number: "#FFB2B2",
          },
          scrollbarLight: "rgba(75,72,72,0.5)",
          scrollbarLightBG: "rgba(255,255,255,0.5)",
          scrollbarDark: "rgba(212,212,212,0.5)",
          scrollbarDarkBG: "rgba(9,7,7,0.5)",
          dropdownIconBg: "#E0DEDE",
          welcomeTourStickySidebarColor: "#FFFFFF",
          welcomeTourStickySidebarBackground: "#F86A2B",
          dropdownIconDarkBg: "#A9A7A7",
          dropdownGreyBg: "#F0F0F0",
          editorBottomBar: {
            background: "#FFFFFF",
            buttonBackgroundHover: "#F0F0F0",
            branchBtnText: "#4B4848",
          },
          gitSyncModal: {
            menuBackgroundColor: "#FAFAFA",
            separator: "#E0DEDE",
            closeIcon: "#575757",
            closeIconHover: "#191919",
          },
          numberedStep: {
            line: "#E0DEDE",
            number: "#000000",
          },
          tabItemBackgroundFill: {
            highlightBackground: "#F0F0F0",
            highlightTextColor: "#191919",
            textColor: "#4B4848",
          },
          overlayColor: "#090707cc",
          displayImageUpload: {
            background: "#AEBAD9",
            label: "#457AE6",
          },
          showcaseCarousel: {
            activeStepDot: "#F86A2B",
            inactiveStepDot: "#FEEDE5",
          },
          mentionSuggestion: {
            nameText: "#090707",
            usernameText: "#716E6E",
            hover: "#EBEBEB",
          },
          reactionsComponent: {
            reactionBackground: "#F0F0F0",
            reactionBackgroundActive: "#FEEDE5",
            text: "#716E6E",
            textActive: "#BF4109",
            borderActive: "#BF4109",
          },
          toggleMode: {
            activeModeBackground: "#EBEBEB",
            activeModeIcon: "#4B4848",
            modeIcon: "#858282",
            modeIconCircleStroke: "#fff",
            activeModeIconCircleStroke: "#EBEBEB",
            unreadIndicator: "#E00D0D",
          },
          helpModal: {
            itemHighlight: "#EBEBEB",
            background: "#FFFFFF",
          },
          globalSearch: {
            containerBackground:
              "linear-gradient(0deg, rgba(43, 43, 43, 0.9), rgba(43, 43, 43, 0.9)), linear-gradient(119.61deg, rgba(35, 35, 35, 0.01) 0.43%, rgba(49, 49, 49, 0.01) 100.67%);",
            activeSearchItemBackground: "#EBEBEB",
            activeCategory: "#090707",
            searchInputText: "#090707",
            searchInputBorder: "#F86A2B",
            containerShadow: "0px 0px 32px 8px rgba(0, 0, 0, 0.25)",
            separator: "#424242",
            searchItemHighlight: "#fff",
            searchItemAltText: "#fff",
            searchItemText: "#090707",
            searchItemSubText: "#4B4848;",
            highlightedTextUnderline: "#03B365",
            helpBarText: "#B3B3B3",
            documentationCtaBackground: "rgba(3, 179, 101, 0.1)",
            documentationCtaText: "#03B365",
            emptyStateText: "#A9A7A7",
            navigateUsingEnterSection: "white",
            codeBackground: "#ffffff",
            documentationCodeBackground: "#f0f0f0",
            documentLink: "#F86A2B",
            helpBarBackground: "#F0F0F0",
            helpButtonBackground: "#F0F0F0",
            helpIcon: "#575757",
            sectionTitle: "#716E6E",
            navigateToEntityEnterkey: "#090707",
            primaryBgColor: "#ffffff",
            primaryTextColor: "#090707",
            secondaryTextColor: "#4b4848",
            primaryBorderColor: "#E0DEDE",
            defaultIconsColor: "#716e6e",
            snippets: {
              refinementPillsColor: "#4b4848",
              refinementPillsBg: "white",
              filterListBackground: "#FAFAFA",
              filterBtnText: "#4B4848",
              filterBtnBg: "#FAFAFA",
              codeContainerBorder: "#E0DEDE",
            },
          },
          navigationMenu: {
            contentActive: "#090707",
            backgroundActive: "#EBEBEB",
            contentInactive: "#4B4848",
            backgroundInactive: "#FFFFFF",
            label: "#A9A7A7",
            warning: "#F22B2B",
            warningBackground: "#FFFFFF",
          },
          selected: "#6A86CE",
          header: {
            separator: "#E0DEDE",
            appName: "#4B4848",
            background: "#FFFFFF",
            deployToolTipText: "#4B4848",
            deployToolTipBackground: "#FFF",
            shareBtnHighlight: "#F86A2B",
            shareBtn: "#4B4848",
            tabsHorizontalSeparator: "#EFEFEF",
            tabText: "#6F6D6D",
            activeTabBorderBottom: "#FF6D2D",
            activeTabText: "#000",
          },
          button: {
            disabledText: "#858282",
            boxShadow: {
              default: {
                variant1: "rgba(0, 0, 0, 0.25)",
                variant2: "rgba(0, 0, 0, 0.25)",
                variant3: "rgba(0, 0, 0, 0.5)",
                variant4: "rgba(0, 0, 0, 0.25)",
                variant5: "rgba(0, 0, 0, 0.25)",
              },
            },
            disabled: {
              bgColor: "#FAFAFA",
              textColor: "#716E6E",
            },
            primary: {
              primary: {
                bgColor: "#03B365",
                hoverColor: "#00693B",
                textColor: "#FFFFFF",
              },
              secondary: {
                borderColor: "#03B365",
                hoverColor: "#D9FDED",
                textColor: "#03B365",
              },
              tertiary: {
                hoverColor: "#CBF4E2",
              },
            },
            warning: {
              primary: {
                bgColor: "#FEB811",
                hoverColor: "#EFA903",
                textColor: "#FFFFFF",
              },
              secondary: {
                borderColor: "#FEB811",
                hoverColor: "#FFFAE9",
                textColor: "#FEB811",
              },
              tertiary: {
                hoverColor: "#FBEED0",
              },
            },
            danger: {
              primary: {
                bgColor: "#F22B2B",
                hoverColor: "#B90707",
                textColor: "#FFFFFF",
              },
              secondary: {
                borderColor: "#F22B2B",
                hoverColor: "#FDE4E4",
                textColor: "#F22B2B",
              },
              tertiary: {
                hoverColor: "#FDE4E4",
              },
            },
            info: {
              primary: {
                bgColor: "#6698FF",
                hoverColor: "#1A65FF",
                textColor: "#FFFFFF",
              },
              secondary: {
                borderColor: "#6698FF",
                hoverColor: "#CEDCFF",
                textColor: "#6698FF",
              },
              tertiary: {
                hoverColor: "#CEDCFF",
              },
            },
            secondary: {
              primary: {
                bgColor: "#858282",
                hoverColor: "#4B4848",
                textColor: "#FFFFFF",
              },
              secondary: {
                borderColor: "#858282",
                hoverColor: "#F0F0F0",
                textColor: "#858282",
              },
              tertiary: {
                hoverColor: "#E8E8E8",
              },
            },
            custom: {
              solid: {
                dark: {
                  textColor: "#333",
                },
                light: {
                  textColor: "#FFFFFF",
                },
              },
            },
            link: {
              main: "#716E6E",
              hover: "#090707",
              active: "#4B4848",
              disabled: "#858282",
            },
          },
          tertiary: {
            main: "#606065",
            light: "#090707",
            dark: "#FAFAFA",
            darker: "#EDEDED",
            darkest: "#A9A7A7",
          },
          info: {
            main: "#F86A2B",
            light: "#DC5B21",
            dark: "#BF4109",
            darker: "#FEEDE5",
            darkest: "#F7EBE6",
          },
          success: {
            main: "#03B365",
            light: "#007340",
            dark: "#00693B",
            darker: "#CBF4E2",
            darkest: "#D9FDED",
          },
          warning: {
            main: "#FEB811",
            light: "#EFA903",
            dark: "#EFA903",
            darker: "#FBEED0",
            darkest: "#FFFAE9",
          },
          danger: {
            main: "#F22B2B",
            light: "#B90707",
            dark: "#C60707",
            darker: "#FDE4E4",
            darkest: "#FFE9E9",
          },
          homepageBackground: "#ffffff",
          card: {
            hoverBG: "#FFFFFF",
            hoverBGOpacity: 0.7,
            hoverBorder: "#F0F0F0",
            iconColor: "#FFFFFF",
          },
          text: {
            normal: "#4B4848",
            heading: "#302D2D",
            highlight: "#FFFFFF",
          },
          icon: {
            normal: "#C5C5C5",
            hover: "#4B4848",
            active: "#302D2D",
          },
          appIcon: {
            normal: "#716E6E",
            background: "#F7F7F7",
          },
          menu: {
            background: "#FFFFFF",
            shadow: "rgba(0, 0, 0, 0.32)",
          },
          menuItem: {
            normalText: "#4B4848",
            normalIcon: "#939090",
            hoverIcon: "#4B4848",
            hoverText: "#090707",
            hoverBg: "#F0F0F0",
            warning: {
              color: "#D2A500",
              bg: "#FDFAF2",
            },
          },
          colorSelector: {
            shadow: "#E8E8E8",
            checkmark: "#000000",
          },
          checkbox: {
            disabled: "#E8E8E8",
            unchecked: "#A9A7A7",
            disabledCheck: "#939090",
            normalCheck: "#FFFFFF",
            labelColor: "#302D2D",
          },
          dropdown: {
            header: {
              text: "#4B4848",
              disabledText: "#9F9F9F",
              defaultBg: "#FFFFFF",
              bg: "#EBEBEB",
              disabledBg: "#F7F7F7",
            },
            menu: {
              border: "#E0DEDE",
              bg: "#FFFFFF",
              text: "#4B4848",
              hover: "#E7E7E7",
              hoverText: "#090707",
              subText: "#858282",
            },
            menuShadow: "0px 6px 20px rgba(0, 0, 0, 0.15)",
            selected: {
              text: "#090707",
              bg: "#EBEBEB",
              icon: "#858282",
              subtext: "#716E6E",
            },
            hovered: {
              text: "#090707",
              bg: "#EBEBEB",
              icon: "#FFFFFF",
            },
            icon: "#716E6E",
          },
          toggle: {
            bg: "#E0DEDE",
            hover: {
              on: "#BF4109",
              off: "#A9A7A7",
            },
            disable: {
              on: "#FEEDE5",
              off: "#E0DEDE",
            },
            disabledSlider: {
              off: "#FFFFFF",
              on: "#FFFFFF",
            },
            spinner: "#A9A7A7",
            spinnerBg: "#E8E8E8",
          },
          textInput: {
            disable: {
              bg: "#F0F0F0",
              text: "#6D6D6D",
              border: "#F0F0F0",
            },
            normal: {
              bg: "#FFFFFF",
              text: "#090707",
              border: "#E0DEDE",
            },
            placeholder: "#A9A7A7",
            helper: "#858282",
            icon: "#716E6E",
            readOnly: {
              bg: "#F0F0F0",
              border: "#F0F0F0",
              text: "#716E6E",
            },
            hover: {
              bg: "#FAFAFA",
            },
            caretColor: "#000000",
          },
          menuBorder: "#E8E8E8",
          editableText: {
            color: "#4B4848",
            bg: "#F0F0F0",
            dangerBg: "rgba(242, 43, 43, 0.06)",
          },
          radio: {
            disable: "#C5C5C5",
            border: "#E8E8E8",
            text: "#090707",
          },
          searchInput: {
            placeholder: "#939090",
            text: "#090707",
            border: "#E0DEDE",
            bg: "#FFFFFF",
            icon: {
              focused: "#090707",
              normal: "#716E6E",
            },
          },
          spinner: "#939090",
          tableDropdown: {
            bg: "#FFFFFF",
            selectedBg: "#F0F0F0",
            selectedText: "#302D2D",
            shadow: "rgba(0, 0, 0, 0.32)",
          },
          tabs: {
            normal: "#858282",
            icon: "#090707",
            hover: "#4B4848",
            border: "#E8E8E8",
            countBg: "#E8E8E8",
            selected: "#F86A2B",
          },
          settingHeading: "#000000",
          table: {
            headerBg: "#F7F7F7",
            headerText: "#939090",
            rowData: "#716E6E",
            rowTitle: "#302D2D",
            border: "#E8E8E8",
            hover: {
              headerColor: "#302D2D",
              rowBg: "#F0F0F0",
              rowTitle: "#090707",
              rowData: "#302D2D",
            },
          },
          applications: {
            bg: "#E8E8E8",
            textColor: "#716E6E",
            workspaceColor: "#716E6E",
            iconColor: "#716E6E",
            hover: {
              bg: "#A9A7A7",
              textColor: "#4B4848",
              workspaceColor: "#302D2D",
            },
            cardMenuIcon: "#F86A2B",
          },
          switch: {
            border: "#A9A7A7",
            bg: "#FFFFFF",
            hover: {
              bg: "#FFFFFF",
            },
            lightText: "#FFFFFF",
            darkText: "#939090",
          },
          queryTemplate: {
            bg: "#FFFFFF",
            color: "#4B4848",
          },
          profileDropdown: {
            name: "#090707",
            userName: "#716E6E",
          },
          modal: {
            bg: "#FFFFFF",
            headerText: "#191919",
            iconColor: "#A9A7A7",
            iconBg: "#FFDEDE",
            user: {
              textColor: "#302D2D",
            },
            email: {
              message: "#302D2D",
              desc: "#716E6E",
            },
            manageUser: "#575757",
            scrollbar: "#A9A7A7",
            separator: "#C5C5C5",
            title: "#4B4848",
            link: "#F86A2B",
            hoverState: "#E8E8E8",
          },
          tagInput: {
            bg: "#FFFFFF",
            tag: {
              text: "#FFFFFF",
            },
            text: "#302D2D",
            placeholder: "#D4D4D4",
            shadow: "none",
          },
          callout: {
            info: {
              color: "#D44100",
              bgColor: "#F8F3F0",
            },
            success: {
              color: "#03B365",
              bgColor: "#E4F4ED",
            },
            danger: {
              color: "#F22B2B",
              bgColor: "#F9E9E9",
            },
            warning: {
              color: "#FEB811",
              bgColor: "#FAF3E3",
            },
          },
          loader: {
            light: "#F0F0F0",
            dark: "#C5C5C5",
          },
          filePicker: {
            bg: "#F0F0F0",
            color: "#716E6E",
            progress: "#939090",
            shadow: {
              from: "rgba(253, 253, 253, 0.0001)",
              to: "rgba(250, 250, 250, 0.898847)",
            },
          },
          formFooter: {
            cancelBtn: "#302D2D",
          },
          toast: {
            undo: "#F86A2B",
            undoRedoColor: "#F8682B",
            warningColor: "#DCAD00",
            dangerColor: "#F22B2B",
            textColor: "#F7F7F7",
            bg: "#090707",
          },
          multiSwitch: {
            bg: "#E8E8E8",
            selectedBg: "#FFFFFF",
            text: "#4B4848",
            border: "#E0DEDE",
          },
          apiPane: {
            bg: "#FFFFFF",
            tabBg: "#FFFFFF",
            text: "#000000",
            keyValueText: "#4B4848",
            dividerBg: "#E8E8E8",
            iconHoverBg: "#F7F7F7",
            requestTree: {
              bg: "#FFFFFF",
              header: {
                text: "#4B4848",
                icon: "#4B4848",
                bg: "#F0F0F0",
              },
              row: {
                hoverBg: "#F0F0F0",
                key: "#716E6E",
                value: "#4B4848",
              },
            },
            closeIcon: "#090707",
            responseBody: {
              bg: "#FFFFFF",
            },
            codeEditor: {
              placeholderColor: "#858282",
            },
            body: {
              text: "#A9A7A7",
            },
            settings: {
              textColor: "#090707",
            },
            pagination: {
              label: "#4B4848",
              description: "#A9A7A7",
              stepTitle: "#090707",
              numberBg: "#E0DEDE",
              bindingBg: "#E8E8E8",
              numberColor: "#090707",
            },
          },
          codeMirror: {
            background: {
              defaultState: "#FAFAFA",
              hoverState: "#E7E7E7",
            },
            text: "#090707",
            dataType: {
              shortForm: "#858282",
              fullForm: "#6D6D6D",
            },
          },
          floatingBtn: {
            tagBackground: "#e22c2c",
            backgroundColor: "#FAFAFA",
            iconColor: "#716E6E",
            borderColor: "#EBEBEB",
          },
          auth: {
            background: "#FFFFFF",
            cardBackground: "#FAFAFA",
            btnPrimary: "#F86A2B",
            inputBackground: "#FFFFFF",
            headingText: "#090707",
            link: "#F86A2B",
            text: "#000",
            placeholder: "#4B4848",
            socialBtnText: "#000",
            socialBtnBorder: "#E0DEDE",
            socialBtnHighlight: "#F0F0F0",
          },
          formMessage: {
            background: {
              danger: "rgba(226,44,44,0.08)",
              success: "#172320",
              warning: "rgba(224, 179, 14, 0.08)",
              lightSuccess: "#EFFFF4",
            },
            text: {
              danger: "#E22C2C",
              success: "#03B365",
              warning: "#E0B30E",
              lightSuccess: "#00693B",
            },
          },
          gif: {
            overlay: "#ffffff",
            text: "#6f6f6f",
            iconPath: "#c4c4c4",
            iconCircle: "#090707",
          },
          treeDropdown: {
            targetBg: "#FFFFFF",
            targetIcon: {
              normal: "#939090",
              hover: "#4B4848",
            },
            menuShadow:
              "0px 0px 2px rgba(0, 0, 0, 0.2), 0px 2px 10px rgba(0, 0, 0, 0.1)",
            menuBg: {
              normal: "#FAFAFA",
              hover: "#6A86CE",
              selected: "#E8E8E8",
            },
            menuText: {
              normal: "#4B4848",
              hover: "#FAFAFA",
              selected: "#4B4848",
            },
          },
          propertyPane: {
            title: "#090707",
            bg: "#F0F0F0",
            label: "#4B4848",
            jsIconBg: "#A9A7A7",
            buttonBg: "#4B4848",
            buttonText: "#FFFFFF",
            radioGroupBg: "#FAFAFA",
            radioGroupText: "#4B4848",
            deleteIconColor: "#A3B3BF",
            zoomButtonBG: "#E0DEDE",
            activeButtonText: "#6A86CE",
            jsButtonHoverBG: "#F0F0F0",
            dropdownSelectBg: "#EBEBEB",
            multiDropdownBoxHoverBg: "#FFFFFF",
            iconColor: "#A9A7A7",
            ctaTextColor: "#202223",
            ctaBackgroundColor: "rgb(248, 106, 43, 0.1)",
            ctaLearnMoreTextColor: "#f86a2b",
            connections: {
              error: "#f22b2b",
              connectionsCount: "#090707",
              optionBg: "rgba(246,71,71, 0.2)",
            },
          },
          scrollbar: "rgba(75,72,72,0.5)",
          scrollbarBG: "transparent",
          debugger: {
            background: "#FFFFFF",
            messageTextColor: "#716e6e",
            label: "#575757",
            entity: "rgba(75, 72, 72, 0.7)",
            entityLink: "#575757",
            jsonIcon: "#a9a7a7",
            message: "#4b4848",
            collapseIcon: "#191919",
            evalDebugButton: {
              hover: "#fafafaaa",
              active: "#fafafaff",
            },
            floatingButton: {
              background: "#2b2b2b",
              color: "#d4d4d4",
              shadow: "0px 12px 28px -6px rgba(0, 0, 0, 0.32)",
              errorCount: "#F22B2B",
              noErrorCount: "#03B365",
              warningCount: "#DCAD00",
            },
            inspectElement: {
              color: "#090707",
            },
            blankState: {
              color: "#090707",
              shortcut: "black",
            },
            info: {
              time: "#939393",
              borderBottom: "#E8E8E8",
            },
            warning: {
              time: "#939393",
              iconColor: "#f3cc3e",
              hoverIconColor: "#e0b30e",
              borderBottom: "#E8E8E8",
              backgroundColor: "#FFF8E2",
            },
            error: {
              time: "#939393",
              type: "#393939",
              iconColor: "#f56060",
              hoverIconColor: "#F22B2B",
              borderBottom: "#E8E8E8",
              backgroundColor: "#F9E9E9",
            },
          },
          guidedTour: {
            runButton: "#f86a2b",
            cancelButton: {
              color: "#716e6e",
              borderColor: "#716e6e",
              hoverBackgroundColor: "#f1f1f1",
            },
            endButton: {
              backgroundColor: "#f22b2b",
              borderColor: "#f22b2b",
              hoverBackgroundColor: "#f34040",
            },
            endTourButton: {
              color: "#4b4848",
              hoverColor: "#928f8f",
            },
            card: {
              borderBottom: "#eeeeee",
              background: "#ffefdb",
            },
            stepCountBackground: "#090707",
          },
          widgetGroupingContextMenu: {
            border: "#69b5ff",
            actionActiveBg: "#e1e1e1",
          },
          actionSidePane: {
            noConnections: "#f0f0f0",
            noConnectionsText: "#e0dede",
            connectionBorder: "rgba(0, 0, 0, 0.5)",
            connectionHover: "#6a86ce",
            collapsibleIcon: "#090707",
          },
          link: "#f86a2b",
          welcomePage: {
            text: "#A9A7A7",
          },
          settings: {
            link: "#716E6E",
          },
        },
        lineHeights: [0, 14, 16, 18, 22, 24, 28, 36, 48, 64, 80],
        fonts: {
          text: "-apple-system, BlinkMacSystemFont, “Segoe UI”, “Roboto”, “Oxygen”, “Ubuntu”, “Cantarell”, “Fira Sans”, “Droid Sans”, “Helvetica Neue”, sans-serif",
          code: 'ui-monospace, Menlo, Monaco, "Cascadia Code", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", Consolas, "Courier New", monospace',
        },
        borders: [
          {
            thickness: 1,
            style: "dashed",
            color: "#BBE8FE",
          },
          {
            thickness: 2,
            style: "solid",
            color: "#BBE8FE",
          },
          {
            thickness: 1,
            style: "solid",
            color: "#E7E7E7",
          },
          {
            thickness: 1,
            style: "solid",
            color: "#BBE8FE",
          },
          {
            thickness: 3,
            style: "solid",
            color: "#E1E8ED",
          },
        ],
        sidebarWidth: "256px",
        homePage: {
          header: 48,
          leftPane: {
            width: 256,
            leftPadding: 16,
            rightMargin: 12,
          },
          main: {
            marginLeft: 112,
          },
          search: {
            height: 81,
            paddingTop: 30,
          },
          sidebar: 256,
        },
        headerHeight: "48px",
        smallHeaderHeight: "40px",
        bottomBarHeight: "37px",
        pageTabsHeight: "32px",
        integrationsPageUnusableHeight: "182px",
        backBanner: "30px",
        canvasBottomPadding: 200,
        navbarMenuHeight: "35px",
        navbarMenuLineHeight: "25px",
        sideNav: {
          maxWidth: 220,
          minWidth: 50,
          bgColor: "#2E3D49",
          fontColor: "#FFFFFF",
          activeItemBGColor: "#21282C",
          navItemHeight: 42,
        },
        card: {
          minWidth: 228,
          minHeight: 124,
          titleHeight: 48,
          divider: {
            thickness: 1,
            style: "solid",
            color: "#E7E7E7",
          },
        },
        dropdown: {
          "0": {
            hoverBG: "#F0F0F0",
            hoverText: "#090707",
            inActiveBG: "#F0F0F0",
            inActiveText: "#090707",
            border: "#FFFFFF",
            background: "#FFFFFF",
          },
          "1": {
            hoverBG: "#1A191C",
            hoverText: "#FFFFFF",
            inActiveBG: "#262626",
            inActiveText: "#D4D4D4",
            border: "#535B62",
            background: "#404040",
          },
        },
        authCard: {
          width: 440,
          dividerSpacing: 32,
          formMessageWidth: 370,
        },
        shadows: [
          "inset -1px 0px 0px #EBEFF2, inset 1px 0px 0px #EBEFF2, inset 0px 4px 0px #03B365",
          "inset -1px 0px 0px #EBEFF2, inset 0px 0px 0px #EBEFF2, inset 0px 4px 0px #03B365",
          "0 1px 1px 0 rgba(60,75,100,.14) ,0 2px 1px -1px rgba(60,75,100,.12), 0 1px 3px 0 rgba(60,75,100,.2)",
        ],
        widgets: {
          tableWidget: {
            selectHighlightColor: "#E7E7E7",
          },
        },
        pageContentWidth: 1224,
        tabPanelHeight: 34,
        alert: {
          info: {
            color: "#0384FE",
          },
          success: {
            color: "#36AB80",
          },
          error: {
            color: "#E22C2C",
          },
          warning: {
            color: "#F7AF22",
          },
        },
        lightningMenu: {
          "0": {
            default: {
              color: "#716E6E",
              background: "transparent",
            },
            active: {
              color: "#FFFFFF",
              background: "#F86A2B",
            },
            hover: {
              color: "#FFFFFF",
              background: "#716E6E",
            },
            none: {
              color: "transparent",
              background: "transparent",
            },
          },
          "1": {
            default: {
              color: "#D4D4D4",
              background: "transparent",
            },
            active: {
              color: "#FFFFFF",
              background: "#CB4810",
            },
            hover: {
              color: "#FFFFFF",
              background: "#D4D4D4",
            },
            none: {
              color: "transparent",
              background: "transparent",
            },
          },
        },
        actionSidePane: {
          width: 280,
        },
        onboarding: {
          statusBarHeight: 92,
        },
        settings: {
          footerHeight: 84,
          footerShadow: "0px 0px 18px -6px rgb(0, 0, 0, 0.25)",
          linkBg: "#F0F0F0",
        },
      },
      hideHeaderShadow: false,
      showHeaderSeparator: false,
    },
    modalAction: {
      modals: [],
    },
    onBoarding: {
      inOnboardingWidgetSelection: false,
      forceOpenWidgetPanel: false,
      firstTimeUserOnboardingApplicationIds: [
        "659bab4bd0cbfb0c5e0a73eb",
        "659baf77d0cbfb0c5e0a73f6",
        "659bfb72d0cbfb0c5e0a741d",
        "659d2e15d0cbfb0c5e0a7428",
      ],
      firstTimeUserOnboardingComplete: false,
      showFirstTimeUserOnboardingModal: false,
      setOverlay: false,
      stepState: [],
      showSignpostingTooltip: false,
      showAnonymousDataPopup: false,
    },
    guidedTour: {
      guidedTour: false,
      loading: false,
      exploring: false,
      currentStep: 1,
      showSuccessMessage: false,
      showInfoMessage: false,
      tableWidgetWasSelected: false,
      hadReachedStep: 0,
      showEndTourDialog: false,
      showDeviatingDialog: false,
      showPostCompletionMessage: false,
      forceShowContent: 0,
    },
    globalSearch: {
      query: "",
      modalOpen: false,
      recentEntities: [
        {
          type: "CANVAS",
          id: "",
          pageId: "659f81c8d0cbfb0c5e0a743b",
        },
        {
          type: "QUERY",
          id: "659fec82d0cbfb0c5e0a745b",
          pageId: "659f81c8d0cbfb0c5e0a743b",
        },
        {
          type: "DATASOURCE",
          id: "659febdcd0cbfb0c5e0a7457",
          pageId: "659f81c8d0cbfb0c5e0a743b",
        },
        {
          type: "DATASOURCE_CREATE",
          id: "NEW",
          pageId: "659f81c8d0cbfb0c5e0a743b",
        },
        {
          type: "JS_OBJECT",
          id: "659f88f3d0cbfb0c5e0a744c",
          pageId: "659f81c8d0cbfb0c5e0a743b",
        },
        {
          type: "JS_OBJECT",
          id: "659f8264d0cbfb0c5e0a7445",
          pageId: "659f81c8d0cbfb0c5e0a743b",
        },
      ],
      recentEntitiesRestored: true,
      filterContext: {
        category: {
          id: "INIT",
        },
      },
    },
    releases: {
      newReleasesCount: "",
      releaseItems: [],
    },
    websocket: {
      appLevelSocketConnected: false,
      pageLevelSocketConnected: false,
    },
    debugger: {
      logs: [
        {
          text: "Datasource structure retrieved",
          source: {
            id: "659f81c8d0cbfb0c5e0a743c",
            name: "users",
            type: "DATASOURCE",
          },
          severity: "info",
          timestamp: "22:24:27",
          category: "PLATFORM_GENERATED",
          occurrenceCount: 1,
          isExpanded: false,
        },
        {
          text: "Datasource structure retrieved",
          source: {
            id: "659febdcd0cbfb0c5e0a7457",
            name: "Movies",
            type: "DATASOURCE",
          },
          severity: "info",
          timestamp: "22:24:29",
          category: "PLATFORM_GENERATED",
          occurrenceCount: 1,
          isExpanded: false,
        },
      ],
      isOpen: false,
      errors: {},
      expandId: "",
      hideErrors: true,
      context: {
        scrollPosition: 0,
        selectedDebuggerTab: "",
        responseTabHeight: 351.6,
        errorCount: 0,
        selectedDebuggerFilter: "",
      },
    },
    tour: {
      isTourInProgress: false,
      activeTourIndex: -1,
    },
    jsPane: {
      isCreating: false,
      isFetching: false,
      isSaving: {},
      isDeleting: {},
      isDirty: {},
      responseTabHeight: 351.6,
      selectedConfigTab: "CODE",
    },
    jsObjectName: {
      isSaving: {},
      errors: {},
    },
    canvasSelection: {
      isDraggingForSelection: false,
      widgetId: "",
      recentlyAddedWidget: {},
    },
    gitSync: {
      isGitSyncModalOpen: false,
      isCommitting: false,
      isCommitSuccessful: false,
      activeGitSyncModalTab: "GIT_CONNECTION",
      isErrorPopupVisible: false,
      isFetchingGitStatus: false,
      isFetchingGitRemoteStatus: false,
      isFetchingMergeStatus: false,
      globalGitConfig: {
        authorEmail: "",
        authorName: "",
      },
      branches: [],
      fetchingBranches: false,
      localGitConfig: {
        authorEmail: "",
        authorName: "",
      },
      isFetchingLocalGitConfig: false,
      isFetchingGlobalGitConfig: false,
      isMerging: false,
      tempRemoteUrl: {
        tempRemoteUrl: "",
      },
      showRepoLimitErrorModal: false,
      isDisconnectGitModalOpen: false,
      disconnectingGitApp: {
        id: "",
        name: "",
      },
      isSwitchingBranch: false,
      switchingToBranch: null,
      isDeploying: false,
      protectedBranchesLoading: false,
      protectedBranches: [],
      isUpdateProtectedBranchesLoading: false,
      isAutocommitModalOpen: false,
      togglingAutocommit: false,
      pollingAutocommitStatus: false,
      gitMetadata: null,
      gitMetadataLoading: false,
    },
    appCollab: {
      editors: [],
      pointerData: {},
      pageEditors: [],
    },
    crudInfoModal: {
      crudInfoModalOpen: false,
      generateCRUDSuccessInfo: null,
    },
    widgetReflow: {
      isReflowing: false,
      reflowingWidgets: {},
    },
    appTheming: {
      stack: [],
      themes: [
        {
          id: "653236225e9a6424e4c04b6b",
          userPermissions: ["read:themes"],
          name: "Default-New",
          displayName: "Modern",
          config: {
            order: 1,
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            },
            fontFamily: {
              appFont: [
                "System Default",
                "Nunito Sans",
                "Poppins",
                "Inter",
                "Montserrat",
                "Noto Sans",
                "Open Sans",
                "Roboto",
                "Rubik",
                "Ubuntu",
              ],
            },
          },
          properties: {
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
            },
            borderRadius: {
              appBorderRadius: "0.375rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            },
            fontFamily: {
              appFont: "System Default",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
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
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "653236225e9a6424e4c04b6c",
          userPermissions: ["read:themes"],
          name: "Classic",
          displayName: "Classic",
          config: {
            order: 2,
            colors: {
              primaryColor: "#16a34a",
              backgroundColor: "#F6F6F6",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            },
            fontFamily: {
              appFont: [
                "System Default",
                "Nunito Sans",
                "Poppins",
                "Inter",
                "Montserrat",
                "Noto Sans",
                "Open Sans",
                "Roboto",
                "Rubik",
                "Ubuntu",
              ],
            },
          },
          properties: {
            colors: {
              primaryColor: "#16a34a",
              backgroundColor: "#F6F6F6",
            },
            borderRadius: {
              appBorderRadius: "0px",
            },
            boxShadow: {
              appBoxShadow: "none",
            },
            fontFamily: {
              appFont: "System Default",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
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
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "653236225e9a6424e4c04b6d",
          userPermissions: ["read:themes"],
          name: "Sunrise",
          displayName: "Sunrise",
          config: {
            order: 3,
            colors: {
              primaryColor: "#ef4444",
              backgroundColor: "#fff1f2",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            },
            fontFamily: {
              appFont: [
                "System Default",
                "Nunito Sans",
                "Poppins",
                "Inter",
                "Montserrat",
                "Noto Sans",
                "Open Sans",
                "Roboto",
                "Rubik",
                "Ubuntu",
              ],
            },
          },
          properties: {
            colors: {
              primaryColor: "#ef4444",
              backgroundColor: "#fff1f2",
            },
            borderRadius: {
              appBorderRadius: "1.5rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
            fontFamily: {
              appFont: "Rubik",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
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
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "653236225e9a6424e4c04b6e",
          userPermissions: ["read:themes"],
          name: "Rounded",
          displayName: "Water Lily",
          config: {
            order: 4,
            colors: {
              primaryColor: "#db2777",
              backgroundColor: "#fdf2f8",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            },
            fontFamily: {
              appFont: [
                "System Default",
                "Nunito Sans",
                "Poppins",
                "Inter",
                "Montserrat",
                "Noto Sans",
                "Open Sans",
                "Roboto",
                "Rubik",
                "Ubuntu",
              ],
            },
          },
          properties: {
            colors: {
              primaryColor: "#db2777",
              backgroundColor: "#fdf2f8",
            },
            borderRadius: {
              appBorderRadius: "1.5rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
            fontFamily: {
              appFont: "Rubik",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
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
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "653236225e9a6424e4c04b6f",
          userPermissions: ["read:themes"],
          name: "Pacific",
          displayName: "Pacific",
          config: {
            order: 5,
            colors: {
              primaryColor: "#0891b2",
              backgroundColor: "#ecfeff",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            },
            fontFamily: {
              appFont: [
                "System Default",
                "Nunito Sans",
                "Poppins",
                "Inter",
                "Montserrat",
                "Noto Sans",
                "Open Sans",
                "Roboto",
                "Rubik",
                "Ubuntu",
              ],
            },
          },
          properties: {
            colors: {
              primaryColor: "#0891b2",
              backgroundColor: "#ecfeff",
            },
            borderRadius: {
              appBorderRadius: "1.5rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
            fontFamily: {
              appFont: "Open Sans",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
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
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "653236225e9a6424e4c04b70",
          userPermissions: ["read:themes"],
          name: "Earth",
          displayName: "Earth",
          config: {
            order: 6,
            colors: {
              primaryColor: "#3b82f6",
              backgroundColor: "#eff6ff",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            },
            fontFamily: {
              appFont: [
                "System Default",
                "Nunito Sans",
                "Poppins",
                "Inter",
                "Montserrat",
                "Noto Sans",
                "Open Sans",
                "Roboto",
                "Rubik",
                "Ubuntu",
              ],
            },
          },
          properties: {
            colors: {
              primaryColor: "#3b82f6",
              backgroundColor: "#eff6ff",
            },
            borderRadius: {
              appBorderRadius: "0.375rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            },
            fontFamily: {
              appFont: "Inter",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
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
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "653236225e9a6424e4c04b71",
          userPermissions: ["read:themes"],
          name: "Pampas",
          displayName: "Pampas",
          config: {
            order: 7,
            colors: {
              primaryColor: "#059669",
              backgroundColor: "#ecfdf5",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            },
            fontFamily: {
              appFont: [
                "System Default",
                "Nunito Sans",
                "Poppins",
                "Inter",
                "Montserrat",
                "Noto Sans",
                "Open Sans",
                "Roboto",
                "Rubik",
                "Ubuntu",
              ],
            },
          },
          properties: {
            colors: {
              primaryColor: "#059669",
              backgroundColor: "#ecfdf5",
            },
            borderRadius: {
              appBorderRadius: "0.375rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            },
            fontFamily: {
              appFont: "Nunito Sans",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
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
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "653236225e9a6424e4c04b72",
          userPermissions: ["read:themes"],
          name: "Sharp",
          displayName: "Moon",
          config: {
            order: 8,
            colors: {
              primaryColor: "#64748b",
              backgroundColor: "#f8fafc",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            },
            fontFamily: {
              appFont: [
                "System Default",
                "Nunito Sans",
                "Poppins",
                "Inter",
                "Montserrat",
                "Noto Sans",
                "Open Sans",
                "Roboto",
                "Rubik",
                "Ubuntu",
              ],
            },
          },
          properties: {
            colors: {
              primaryColor: "#64748b",
              backgroundColor: "#f8fafc",
            },
            borderRadius: {
              appBorderRadius: "0px",
            },
            boxShadow: {
              appBoxShadow: "none",
            },
            fontFamily: {
              appFont: "Nunito Sans",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
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
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
        {
          id: "653236225e9a6424e4c04b73",
          userPermissions: ["read:themes"],
          name: "Default",
          displayName: "Modern",
          config: {
            order: 9,
            isDeprecated: true,
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
            },
            borderRadius: {
              appBorderRadius: {
                none: "0px",
                M: "0.375rem",
                L: "1.5rem",
              },
            },
            boxShadow: {
              appBoxShadow: {
                none: "none",
                S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
                M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              },
            },
            fontFamily: {
              appFont: [
                "System Default",
                "Nunito Sans",
                "Poppins",
                "Inter",
                "Montserrat",
                "Noto Sans",
                "Open Sans",
                "Roboto",
                "Rubik",
                "Ubuntu",
              ],
            },
          },
          properties: {
            colors: {
              primaryColor: "#553DE9",
              backgroundColor: "#F8FAFC",
            },
            borderRadius: {
              appBorderRadius: "0.375rem",
            },
            boxShadow: {
              appBoxShadow:
                "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
            },
            fontFamily: {
              appFont: "Nunito Sans",
            },
          },
          stylesheet: {
            AUDIO_RECORDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            BUTTON_GROUP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                },
              },
            },
            CAMERA_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            CHECKBOX_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CHECKBOX_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CONTAINER_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            CIRCULAR_PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CURRENCY_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PHONE_INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DATE_PICKER_WIDGET2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FILE_PICKER_WIDGET_V2: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            FORM_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            ICON_BUTTON_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            IFRAME_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            IMAGE_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            INPUT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            JSON_FORM_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              submitButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
              resetButtonStyles: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
              },
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
            },
            LIST_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            MAP_CHART_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            },
            MENU_BUTTON_WIDGET: {
              menuColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MODAL_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            MULTI_SELECT_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            DROP_DOWN_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            PROGRESSBAR_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            PROGRESS_WIDGET: {
              fillColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            CODE_SCANNER_WIDGET: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            RATE_WIDGET: {
              activeColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RADIO_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            RICH_TEXT_EDITOR_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            STATBOX_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SWITCH_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              boxShadow: "none",
            },
            SWITCH_GROUP_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            SELECT_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            TABLE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
              },
            },
            TABLE_WIDGET_V2: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
              childStylesheet: {
                button: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                menuButton: {
                  menuColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
                  boxShadow: "none",
                },
                iconButton: {
                  buttonColor: "{{appsmith.theme.colors.primaryColor}}",
                  borderRadius:
                    "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
            },
            TABS_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            TEXT_WIDGET: {
              truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
              fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            },
            VIDEO_WIDGET: {
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            },
            SINGLE_SELECT_TREE_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            CATEGORY_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            NUMBER_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
            RANGE_SLIDER_WIDGET: {
              accentColor: "{{appsmith.theme.colors.primaryColor}}",
            },
          },
          new: false,
          isSystemTheme: true,
        },
      ],
      isSaving: false,
      isChanging: false,
      themesLoading: false,
      isBetaCardShown: null,
      selectedThemeLoading: false,
      selectedTheme: {
        id: "653236225e9a6424e4c04b6b",
        userPermissions: ["read:themes"],
        name: "Default-New",
        displayName: "Modern",
        config: {
          order: 1,
          colors: {
            primaryColor: "#553DE9",
            backgroundColor: "#F8FAFC",
          },
          borderRadius: {
            appBorderRadius: {
              none: "0px",
              M: "0.375rem",
              L: "1.5rem",
            },
          },
          boxShadow: {
            appBoxShadow: {
              none: "none",
              S: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
              M: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              L: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            },
          },
          fontFamily: {
            appFont: [
              "System Default",
              "Nunito Sans",
              "Poppins",
              "Inter",
              "Montserrat",
              "Noto Sans",
              "Open Sans",
              "Roboto",
              "Rubik",
              "Ubuntu",
            ],
          },
        },
        properties: {
          colors: {
            primaryColor: "#553DE9",
            backgroundColor: "#F8FAFC",
          },
          borderRadius: {
            appBorderRadius: "0.375rem",
          },
          boxShadow: {
            appBoxShadow:
              "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
          },
          fontFamily: {
            appFont: "System Default",
          },
        },
        stylesheet: {
          AUDIO_RECORDER_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          BUTTON_WIDGET: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          BUTTON_GROUP_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
            childStylesheet: {
              button: {
                buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              },
            },
          },
          CAMERA_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          CHART_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
          },
          CHECKBOX_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          CHECKBOX_GROUP_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          CONTAINER_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          CIRCULAR_PROGRESS_WIDGET: {
            fillColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          CURRENCY_INPUT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          PHONE_INPUT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          DATE_PICKER_WIDGET2: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          FILE_PICKER_WIDGET_V2: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          FORM_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          FORM_BUTTON_WIDGET: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          ICON_BUTTON_WIDGET: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          IFRAME_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          IMAGE_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          INPUT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          INPUT_WIDGET_V2: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          JSON_FORM_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            submitButtonStyles: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            resetButtonStyles: {
              buttonColor: "{{appsmith.theme.colors.primaryColor}}",
              borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
              boxShadow: "none",
            },
            childStylesheet: {
              ARRAY: {
                accentColor: "{{appsmith.theme.colors.primaryColor}}",
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
                cellBorderRadius:
                  "{{appsmith.theme.borderRadius.appBorderRadius}}",
                cellBoxShadow: "none",
              },
              OBJECT: {
                borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
                boxShadow: "none",
                cellBorderRadius:
                  "{{appsmith.theme.borderRadius.appBorderRadius}}",
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
          },
          LIST_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          MAP_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          MAP_CHART_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
          },
          MENU_BUTTON_WIDGET: {
            menuColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          MODAL_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          MULTI_SELECT_TREE_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          MULTI_SELECT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          MULTI_SELECT_WIDGET_V2: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          DROP_DOWN_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          PROGRESSBAR_WIDGET: {
            fillColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          PROGRESS_WIDGET: {
            fillColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          CODE_SCANNER_WIDGET: {
            buttonColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          RATE_WIDGET: {
            activeColor: "{{appsmith.theme.colors.primaryColor}}",
          },
          RADIO_GROUP_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            boxShadow: "none",
          },
          RICH_TEXT_EDITOR_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          STATBOX_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          SWITCH_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            boxShadow: "none",
          },
          SWITCH_GROUP_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
          },
          SELECT_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          TABLE_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
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
            },
          },
          TABLE_WIDGET_V2: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
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
          },
          TABS_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          TEXT_WIDGET: {
            truncateButtonColor: "{{appsmith.theme.colors.primaryColor}}",
            fontFamily: "{{appsmith.theme.fontFamily.appFont}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
          },
          VIDEO_WIDGET: {
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "{{appsmith.theme.boxShadow.appBoxShadow}}",
          },
          SINGLE_SELECT_TREE_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
            borderRadius: "{{appsmith.theme.borderRadius.appBorderRadius}}",
            boxShadow: "none",
          },
          CATEGORY_SLIDER_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
          },
          NUMBER_SLIDER_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
          },
          RANGE_SLIDER_WIDGET: {
            accentColor: "{{appsmith.theme.colors.primaryColor}}",
          },
        },
        new: false,
        isSystemTheme: true,
      },
    },
    mainCanvas: {
      initialized: true,
      width: 1160,
      height: 1292,
      isMobile: false,
    },
    appSettingsPane: {
      isOpen: false,
      context: {
        type: 0,
      },
    },
    focusHistory: {
      history: {},
    },
    editorContext: {
      codeEditorHistory: {},
      propertySectionState: {},
      selectedPropertyTabIndex: 0,
      propertyPanelState: {},
      entityCollapsibleFields: {},
      subEntityCollapsibleFields: {},
      explorerSwitchIndex: 0,
    },
    libraries: {
      isInstallerOpen: false,
      installationStatus: {},
      installedLibraries: [
        {
          name: "jspdf",
          accessor: ["jspdf"],
          version: "2.5.1",
          url: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
          id: "655317be44e16d2e57f05dce",
        },
        {
          name: "lodash",
          docsURL: "https://lodash.com/docs/4.17.21",
          version: "4.17.21",
          accessor: ["_"],
        },
        {
          name: "moment",
          docsURL: "https://momentjs.com/docs/",
          version: "0.5.35",
          accessor: ["moment"],
        },
        {
          name: "forge",
          docsURL: "https://github.com/digitalbazaar/forge",
          version: "1.3.0",
          accessor: ["forge"],
        },
      ],
      reservedNames: [],
    },
    autoHeightUI: {
      isAutoHeightWithLimitsChanging: false,
    },
    layoutConversion: {
      conversionState: "START",
      isConverting: false,
    },
    actionSelector: {},
    oneClickBinding: {
      isConnecting: false,
      config: null,
      showOptions: false,
    },
    activeField: null,
    ide: {
      view: "FullScreen",
      pagesActive: false,
    },
  },
  evaluations: {
    tree: {},
    dependencies: {
      inverseDependencyMap: {},
    },
    loadingEntities: {},
    formEvaluation: {},
    triggers: {},
  },
  form: {},
  settings: {
    isLoading: false,
    isSaving: false,
    isRestarting: false,
    showReleaseNotes: false,
    isRestartFailed: false,
    config: {
      instanceName: "Appsmith",
      emailVerificationEnabled: false,
    },
  },
  organization: {
    userPermissions: [],
    organizationConfiguration: {
      brandFaviconUrl:
        "https://assets.appsmith.com/appsmith-favicon-orange.ico",
      brandColors: {
        primary: "#e15615",
        background: "#F1F5F9",
        hover: "#cf4d10",
        active: "#ca520f",
        font: "#fff",
        disabled: "#fce4da",
      },
      brandLogoUrl: "https://assets.appsmith.com/appsmith-logo-no-margin.png",
      isFormLoginEnabled: true,
      instanceName: "Appsmith",
      license: {
        plan: "FREE",
      },
      emailVerificationEnabled: false,
      thirdPartyAuths: null,
      migrationStatus: "COMPLETED",
      featuresWithPendingMigration: {},
    },
    new: false,
    isLoading: false,
    instanceId: "653236215e9a6424e4c04b56",
  },
  linting: {
    errors: {},
  },
};
