export const unEvalTree = {
  MainContainer: {
    widgetName: "MainContainer",
    backgroundColor: "none",
    rightColumn: 816,
    snapColumns: 64,
    detachFromLayout: true,
    widgetId: "0",
    topRow: 0,
    bottomRow: 1290,
    containerStyle: "none",
    snapRows: 125,
    parentRowSpace: 1,
    type: "CANVAS_WIDGET",
    canExtend: true,
    version: 53,
    minHeight: 1292,
    parentColumnSpace: 1,
    dynamicBindingPathList: [],
    leftColumn: 0,
    children: ["tnqvuifxl1", "ha99zcctgq"],
    defaultProps: {},
    defaultMetaProps: [],
    logBlackList: {},
    meta: {},
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    reactivePaths: {},
    bindingPaths: {},
    triggerPaths: {},
    validationPaths: {},
    ENTITY_TYPE: "WIDGET",
    privateWidgets: {},
  },
  Table1: {
    widgetName: "Table1",
    defaultPageSize: 0,
    columnOrder: ["step", "task", "status", "action"],
    isVisibleDownload: true,
    displayName: "Table",
    iconSVG: "/static/media/icon.db8a9cbd.svg",
    topRow: 13,
    bottomRow: 41,
    isSortable: true,
    parentRowSpace: 10,
    type: "TABLE_WIDGET",
    defaultSelectedRow: "0",
    hideCard: false,
    animateLoading: true,
    parentColumnSpace: 12.5625,
    dynamicTriggerPathList: [],
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
        key: "selectedRow",
      },
      {
        key: "triggeredRow",
      },
      {
        key: "selectedRows",
      },
      {
        key: "pageSize",
      },
      {
        key: "triggerRowSelection",
      },
      {
        key: "sanitizedTableData",
      },
      {
        key: "tableColumns",
      },
      {
        key: "filteredTableData",
      },
    ],
    leftColumn: 11,
    primaryColumns: {
      step: {
        index: 0,
        width: 150,
        id: "step",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDerived: false,
        label: "step",
        computedValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.step))}}",
        buttonColor: "#03B365",
        menuColor: "#03B365",
        labelColor: "#FFFFFF",
      },
      task: {
        index: 1,
        width: 150,
        id: "task",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDerived: false,
        label: "task",
        computedValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.task))}}",
        buttonColor: "#03B365",
        menuColor: "#03B365",
        labelColor: "#FFFFFF",
      },
      status: {
        index: 2,
        width: 150,
        id: "status",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "text",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDerived: false,
        label: "status",
        computedValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.status))}}",
        buttonColor: "#03B365",
        menuColor: "#03B365",
        labelColor: "#FFFFFF",
      },
      action: {
        index: 3,
        width: 150,
        id: "action",
        horizontalAlignment: "LEFT",
        verticalAlignment: "CENTER",
        columnType: "button",
        textSize: "PARAGRAPH",
        enableFilter: true,
        enableSort: true,
        isVisible: true,
        isCellVisible: true,
        isDisabled: false,
        isDerived: false,
        label: "action",
        onClick:
          "{{currentRow.step === '#1' ? showAlert('Done', 'success') : currentRow.step === '#2' ? navigateTo('https://docs.appsmith.com/core-concepts/connecting-to-data-sources/querying-a-database',undefined,'NEW_WINDOW') : navigateTo('https://docs.appsmith.com/core-concepts/displaying-data-read/display-data-tables',undefined,'NEW_WINDOW')}}",
        computedValue:
          "{{Table1.sanitizedTableData.map((currentRow) => ( currentRow.action))}}",
        buttonColor: "#03B365",
        menuColor: "#03B365",
        labelColor: "#FFFFFF",
      },
    },
    delimiter: ",",
    key: "ospdtp4f03",
    derivedColumns: {},
    rightColumn: 54,
    textSize: "PARAGRAPH",
    widgetId: "tnqvuifxl1",
    isVisibleFilters: true,
    tableData:
      '[\n  {\n    "step": "#1",\n    "task": "Drop a table",\n    "status": "✅",\n    "action": ""\n  }\n]',
    isVisible: true,
    label: "Data",
    searchKey: "",
    enableClientSideSearch: true,
    version: 3,
    totalRecordsCount: 0,
    parentId: "0",
    renderMode: "CANVAS",
    isLoading: false,
    horizontalAlignment: "LEFT",
    isVisibleSearch: true,
    isVisiblePagination: true,
    verticalAlignment: "CENTER",
    columnSizeMap: {
      task: 245,
      step: 62,
      status: 75,
    },
    pageNo: 1,
    filters: [],
    sortOrder: {
      column: "",
      order: null,
    },
    selectedRow:
      '{{(()=>{let selectedRowIndices = [];    if (      Array.isArray(Table1.selectedRowIndices) &&      Table1.selectedRowIndices.every((el) => typeof el === "number")    ) {      selectedRowIndices = Table1.selectedRowIndices;    } else if (typeof Table1.selectedRowIndices === "number") {      selectedRowIndices = [Table1.selectedRowIndices];    }    let selectedRowIndex;    if (Table1.multiRowSelection) {      selectedRowIndex = selectedRowIndices.length        ? selectedRowIndices[selectedRowIndices.length - 1]        : -1;    } else {      selectedRowIndex =        Table1.selectedRowIndex === undefined ||        Number.isNaN(parseInt(Table1.selectedRowIndex))          ? -1          : parseInt(Table1.selectedRowIndex);    }    const filteredTableData =      Table1.filteredTableData || Table1.sanitizedTableData || [];    if (selectedRowIndex === -1) {      const emptyRow = { ...filteredTableData[0] };      Object.keys(emptyRow).forEach((key) => {        emptyRow[key] = "";      });      return emptyRow;    }    const selectedRow = { ...filteredTableData[selectedRowIndex] };    return selectedRow;})()}}',
    triggeredRow:
      '{{(()=>{const triggeredRowIndex =      Table1.triggeredRowIndex === undefined ||      Number.isNaN(parseInt(Table1.triggeredRowIndex))        ? -1        : parseInt(Table1.triggeredRowIndex);    const tableData = Table1.sanitizedTableData || [];    if (triggeredRowIndex === -1) {      const emptyRow = { ...tableData[0] };      Object.keys(emptyRow).forEach((key) => {        emptyRow[key] = "";      });      return emptyRow;    }    const triggeredRow = { ...tableData[triggeredRowIndex] };    return triggeredRow;})()}}',
    selectedRows:
      "{{(()=>{const selectedRowIndices = Array.isArray(Table1.selectedRowIndices)      ? Table1.selectedRowIndices      : [];    const filteredTableData =      Table1.filteredTableData || Table1.sanitizedTableData || [];    const selectedRows = selectedRowIndices.map(      (ind) => filteredTableData[ind],    );    return selectedRows;})()}}",
    pageSize:
      '{{(()=>{const TABLE_SIZES = {      DEFAULT: {        COLUMN_HEADER_HEIGHT: 32,        TABLE_HEADER_HEIGHT: 38,        ROW_HEIGHT: 40,        ROW_FONT_SIZE: 14,      },      SHORT: {        COLUMN_HEADER_HEIGHT: 32,        TABLE_HEADER_HEIGHT: 38,        ROW_HEIGHT: 20,        ROW_FONT_SIZE: 12,      },      TALL: {        COLUMN_HEADER_HEIGHT: 32,        TABLE_HEADER_HEIGHT: 38,        ROW_HEIGHT: 60,        ROW_FONT_SIZE: 18,      },    };    const compactMode = Table1.compactMode || "DEFAULT";    const componentHeight =      (Table1.bottomRow - Table1.topRow) * Table1.parentRowSpace - 10;    const tableSizes = TABLE_SIZES[compactMode];    let pageSize = Math.floor(      (componentHeight -        tableSizes.TABLE_HEADER_HEIGHT -        tableSizes.COLUMN_HEADER_HEIGHT) /        tableSizes.ROW_HEIGHT,    );    if (      componentHeight -        (tableSizes.TABLE_HEADER_HEIGHT +          tableSizes.COLUMN_HEADER_HEIGHT +          tableSizes.ROW_HEIGHT * pageSize) >      0    ) {      pageSize += 1;    }    return pageSize;})()}}',
    triggerRowSelection: "{{!!Table1.onRowSelected}}",
    sanitizedTableData:
      '{{(()=>{const separatorRegex = /\\W+/;    if (Table1.tableData && Array.isArray(Table1.tableData)) {      return Table1.tableData.map((entry) => {        const sanitizedData = {};        for (const [key, value] of Object.entries(entry)) {          let sanitizedKey = key            .split(separatorRegex)            .join("_")            .slice(0, 200);          sanitizedKey = _.isNaN(Number(sanitizedKey))            ? sanitizedKey            : `_${sanitizedKey}`;          sanitizedData[sanitizedKey] = value;        }        return sanitizedData;      });    }    return [];})()}}',
    tableColumns:
      '{{(()=>{let columns = [];    let allColumns = Object.assign({}, Table1.primaryColumns || {});    const data = Table1.sanitizedTableData || [];    if (data.length > 0) {      const columnIdsFromData = [];      for (let i = 0, tableRowCount = data.length; i < tableRowCount; i++) {        const row = data[i];        for (const key in row) {          if (!columnIdsFromData.includes(key)) {            columnIdsFromData.push(key);          }        }      }      columnIdsFromData.forEach((id) => {        if (!allColumns[id]) {          const currIndex = Object.keys(allColumns).length;          allColumns[id] = {            index: currIndex,            width: 150,            id,            horizontalAlignment: "LEFT",            verticalAlignment: "CENTER",            columnType: "text",            textColor: "#231F20",            textSize: "PARAGRAPH",            fontStyle: "REGULAR",            enableFilter: true,            enableSort: true,            isVisible: true,            isDerived: false,            label: id,            computedValue: Table1.sanitizedTableData.map(              (currentRow) => currentRow[id],            ),          };        }      });      const existingColumnIds = Object.keys(allColumns);      const idsNotToShow = _.without(existingColumnIds, ...columnIdsFromData)        .map((idNotInData) => {          if (allColumns[idNotInData] && !allColumns[idNotInData].isDerived)            return idNotInData;          return undefined;        })        .filter(Boolean);      idsNotToShow.forEach((id) => delete allColumns[id]);    }    const sortColumn = Table1.sortOrder.column;    const sortOrder = Table1.sortOrder.order === "asc" ? true : false;    if (      Table1.columnOrder &&      Array.isArray(Table1.columnOrder) &&      Table1.columnOrder.length > 0    ) {      const newColumnsInOrder = {};      _.uniq(Table1.columnOrder).forEach((id, index) => {        if (allColumns[id])          newColumnsInOrder[id] = { ...allColumns[id], index };      });      const remaining = _.without(        Object.keys(allColumns),        ...Object.keys(newColumnsInOrder),      );      const len = Object.keys(newColumnsInOrder).length;      if (remaining && remaining.length > 0) {        remaining.forEach((id, index) => {          newColumnsInOrder[id] = { ...allColumns[id], index: len + index };        });      }      allColumns = newColumnsInOrder;    }    const allColumnProperties = Object.values(allColumns);    for (let index = 0; index < allColumnProperties.length; index++) {      const columnProperties = { ...allColumnProperties[index] };      columnProperties.isAscOrder =        columnProperties.id === sortColumn ? sortOrder : undefined;      const columnData = columnProperties;      columns.push(columnData);    }    return columns.filter((column) => column.id);})()}}',
    filteredTableData:
      '{{(()=>{ if (!Table1.sanitizedTableData || !Table1.sanitizedTableData.length) {      return [];    }    let derivedTableData = [...Table1.sanitizedTableData];    if (Table1.primaryColumns && _.isPlainObject(Table1.primaryColumns)) {      const primaryColumns = Table1.primaryColumns;      const columnIds = Object.keys(Table1.primaryColumns);      columnIds.forEach((columnId) => {        const column = primaryColumns[columnId];        let computedValues = [];        if (column && column.computedValue) {          if (_.isString(column.computedValue)) {            try {              computedValues = JSON.parse(column.computedValue);            } catch (e) {              console.error(                e,                "Error parsing column value: ",                column.computedValue,              );            }          } else if (Array.isArray(column.computedValue)) {            computedValues = column.computedValue;          }        }        if (computedValues.length === 0) {          if (Table1.derivedColumns) {            const derivedColumn = Table1.derivedColumns[columnId];            if (derivedColumn) {              computedValues = Array(derivedTableData.length).fill("");            }          }        }        for (let index = 0; index < computedValues.length; index++) {          derivedTableData[index] = {            ...derivedTableData[index],            [columnId]: computedValues[index],          };        }      });    }    derivedTableData = derivedTableData.map((item, index) => ({      ...item,      __originalIndex__: index,      __primaryKey__: Table1.primaryColumnId        ? item[Table1.primaryColumnId]        : undefined,    }));    const columns = Table1.tableColumns;    const sortedColumn = Table1.sortOrder.column;    let sortedTableData;    if (sortedColumn) {      const sortOrder = Table1.sortOrder.order === "asc" ? true : false;      const column = columns.find((column) => column.id === sortedColumn);      const columnType =        column && column.columnType ? column.columnType : "text";      const inputFormat = column.inputFormat;      const isEmptyOrNil = (value) => {        return _.isNil(value) || value === "";      };      sortedTableData = derivedTableData.sort((a, b) => {        if (_.isPlainObject(a) && _.isPlainObject(b)) {          if (isEmptyOrNil(a[sortedColumn]) || isEmptyOrNil(b[sortedColumn])) {            /* push null, undefined and "" values to the bottom. */            return isEmptyOrNil(a[sortedColumn]) ? 1 : -1;          } else {            switch (columnType) {              case "number":                return sortOrder                  ? Number(a[sortedColumn]) > Number(b[sortedColumn])                    ? 1                    : -1                  : Number(b[sortedColumn]) > Number(a[sortedColumn])                  ? 1                  : -1;              case "date":                try {                  return sortOrder                    ? moment(a[sortedColumn], inputFormat).isAfter(                        moment(b[sortedColumn], inputFormat),                      )                      ? 1                      : -1                    : moment(b[sortedColumn], inputFormat).isAfter(                        moment(a[sortedColumn], inputFormat),                      )                    ? 1                    : -1;                } catch (e) {                  return -1;                }              default:                return sortOrder                  ? a[sortedColumn].toString().toUpperCase() >                    b[sortedColumn].toString().toUpperCase()                    ? 1                    : -1                  : b[sortedColumn].toString().toUpperCase() >                    a[sortedColumn].toString().toUpperCase()                  ? 1                  : -1;            }          }        } else {          return sortOrder ? 1 : 0;        }      });    } else {      sortedTableData = [...derivedTableData];    }    const ConditionFunctions = {      isExactly: (a, b) => {        return a.toString() === b.toString();      },      empty: (a) => {        if (a === null || a === undefined || a === "") return true;        return _.isEmpty(a.toString());      },      notEmpty: (a) => {        return a !== "" && a !== undefined && a !== null;      },      notEqualTo: (a, b) => {        return a.toString() !== b.toString();      },      isEqualTo: (a, b) => {        return a.toString() === b.toString();      },      lessThan: (a, b) => {        const numericB = Number(b);        const numericA = Number(a);        return numericA < numericB;      },      lessThanEqualTo: (a, b) => {        const numericB = Number(b);        const numericA = Number(a);        return numericA <= numericB;      },      greaterThan: (a, b) => {        const numericB = Number(b);        const numericA = Number(a);        return numericA > numericB;      },      greaterThanEqualTo: (a, b) => {        const numericB = Number(b);        const numericA = Number(a);        return numericA >= numericB;      },      contains: (a, b) => {        try {          return a            .toString()            .toLowerCase()            .includes(b.toString().toLowerCase());        } catch (e) {          return false;        }      },      doesNotContain: (a, b) => {        try {          return !a            .toString()            .toLowerCase()            .includes(b.toString().toLowerCase());        } catch (e) {          return false;        }      },      startsWith: (a, b) => {        try {          return (            a              .toString()              .toLowerCase()              .indexOf(b.toString().toLowerCase()) === 0          );        } catch (e) {          return false;        }      },      endsWith: (a, b) => {        try {          const _a = a.toString().toLowerCase();          const _b = b.toString().toLowerCase();          return _a.length === _a.lastIndexOf(_b) + _b.length;        } catch (e) {          return false;        }      },      is: (a, b) => {        return moment(a).isSame(moment(b), "minute");      },      isNot: (a, b) => {        return !moment(a).isSame(moment(b), "minute");      },      isAfter: (a, b) => {        return moment(a).isAfter(moment(b), "minute");      },      isBefore: (a, b) => {        return moment(a).isBefore(moment(b), "minute");      },    };    const getSearchKey = () => {      if (        Table1.searchText &&        (!Table1.onSearchTextChanged || Table1.enableClientSideSearch)      ) {        return Table1.searchText.toLowerCase();      }      return "";    };    const finalTableData = sortedTableData.filter((item) => {      const searchFound = getSearchKey()        ? Object.values(item)            .join(", ")            .toLowerCase()            .includes(getSearchKey())        : true;      if (!searchFound) return false;      if (!Table1.filters || Table1.filters.length === 0) return true;      const filters = Table1.filters;      const filterOperator = filters.length >= 2 ? filters[1].operator : "OR";      let filter = filterOperator === "AND";      for (let i = 0; i < filters.length; i++) {        let result = true;        try {          const conditionFunction = ConditionFunctions[filters[i].condition];          if (conditionFunction) {            result = conditionFunction(              item[filters[i].column],              filters[i].value,            );          }        } catch (e) {          console.error(e);        }        const filterValue = result;        filter =          filterOperator === "AND"            ? filter && filterValue            : filter || filterValue;      }      return filter;    });    return finalTableData;})()}}',
    defaultProps: {
      searchText: "defaultSearchText",
      selectedRowIndex: "defaultSelectedRow",
      selectedRowIndices: "defaultSelectedRow",
    },
    defaultMetaProps: [
      "pageNo",
      "selectedRowIndex",
      "selectedRowIndices",
      "searchText",
      "triggeredRowIndex",
      "filters",
      "sortOrder",
    ],
    logBlackList: {
      selectedRow: true,
      triggeredRow: true,
      selectedRows: true,
      pageSize: true,
      triggerRowSelection: true,
      sanitizedTableData: true,
      tableColumns: true,
      filteredTableData: true,
    },
    meta: {},
    propertyOverrideDependency: {
      searchText: {
        DEFAULT: "defaultSearchText",
        META: "meta.searchText",
      },
      selectedRowIndex: {
        DEFAULT: "defaultSelectedRow",
        META: "meta.selectedRowIndex",
      },
      selectedRowIndices: {
        DEFAULT: "defaultSelectedRow",
        META: "meta.selectedRowIndices",
      },
    },
    overridingPropertyPaths: {
      defaultSearchText: ["searchText", "meta.searchText"],
      "meta.searchText": ["searchText"],
      defaultSelectedRow: [
        "selectedRowIndex",
        "meta.selectedRowIndex",
        "selectedRowIndices",
        "meta.selectedRowIndices",
      ],
      "meta.selectedRowIndex": ["selectedRowIndex"],
      "meta.selectedRowIndices": ["selectedRowIndices"],
    },
    reactivePaths: {
      selectedRow: "TEMPLATE",
      triggeredRow: "TEMPLATE",
      selectedRows: "TEMPLATE",
      pageSize: "TEMPLATE",
      triggerRowSelection: "TEMPLATE",
      sanitizedTableData: "TEMPLATE",
      tableColumns: "TEMPLATE",
      filteredTableData: "TEMPLATE",
      pageNo: "TEMPLATE",
      selectedRowIndex: "TEMPLATE",
      selectedRowIndices: "TEMPLATE",
      searchText: "TEMPLATE",
      triggeredRowIndex: "TEMPLATE",
      filters: "TEMPLATE",
      sortOrder: "TEMPLATE",
      defaultSearchText: "TEMPLATE",
      "primaryColumns.step.computedValue": "TEMPLATE",
      "primaryColumns.task.computedValue": "TEMPLATE",
      "primaryColumns.status.computedValue": "TEMPLATE",
      "primaryColumns.action.computedValue": "TEMPLATE",
      "meta.searchText": "TEMPLATE",
      defaultSelectedRow: "TEMPLATE",
      "meta.selectedRowIndex": "TEMPLATE",
      "meta.selectedRowIndices": "TEMPLATE",
      tableData: "SMART_SUBSTITUTE",
      "primaryColumns.action.buttonLabelColor": "TEMPLATE",
      "primaryColumns.action.buttonColor": "TEMPLATE",
      "primaryColumns.action.buttonLabel": "TEMPLATE",
      "primaryColumns.action.isDisabled": "TEMPLATE",
      "primaryColumns.action.isCellVisible": "TEMPLATE",
      "primaryColumns.status.cellBackground": "TEMPLATE",
      "primaryColumns.status.textColor": "TEMPLATE",
      "primaryColumns.status.verticalAlignment": "TEMPLATE",
      "primaryColumns.status.fontStyle": "TEMPLATE",
      "primaryColumns.status.textSize": "TEMPLATE",
      "primaryColumns.status.horizontalAlignment": "TEMPLATE",
      "primaryColumns.status.isCellVisible": "TEMPLATE",
      "primaryColumns.task.cellBackground": "TEMPLATE",
      "primaryColumns.task.textColor": "TEMPLATE",
      "primaryColumns.task.verticalAlignment": "TEMPLATE",
      "primaryColumns.task.fontStyle": "TEMPLATE",
      "primaryColumns.task.textSize": "TEMPLATE",
      "primaryColumns.task.horizontalAlignment": "TEMPLATE",
      "primaryColumns.task.isCellVisible": "TEMPLATE",
      "primaryColumns.step.cellBackground": "TEMPLATE",
      "primaryColumns.step.textColor": "TEMPLATE",
      "primaryColumns.step.verticalAlignment": "TEMPLATE",
      "primaryColumns.step.fontStyle": "TEMPLATE",
      "primaryColumns.step.textSize": "TEMPLATE",
      "primaryColumns.step.horizontalAlignment": "TEMPLATE",
      "primaryColumns.step.isCellVisible": "TEMPLATE",
      primaryColumnId: "TEMPLATE",
      compactMode: "TEMPLATE",
      isVisible: "TEMPLATE",
      animateLoading: "TEMPLATE",
      isSortable: "TEMPLATE",
      isVisibleSearch: "TEMPLATE",
      isVisibleFilters: "TEMPLATE",
      isVisibleDownload: "TEMPLATE",
      isVisiblePagination: "TEMPLATE",
      delimiter: "TEMPLATE",
    },
    bindingPaths: {
      tableData: "SMART_SUBSTITUTE",
      "primaryColumns.action.buttonLabelColor": "TEMPLATE",
      "primaryColumns.action.buttonColor": "TEMPLATE",
      "primaryColumns.action.buttonLabel": "TEMPLATE",
      "primaryColumns.action.isDisabled": "TEMPLATE",
      "primaryColumns.action.isCellVisible": "TEMPLATE",
      "primaryColumns.status.cellBackground": "TEMPLATE",
      "primaryColumns.status.textColor": "TEMPLATE",
      "primaryColumns.status.verticalAlignment": "TEMPLATE",
      "primaryColumns.status.fontStyle": "TEMPLATE",
      "primaryColumns.status.textSize": "TEMPLATE",
      "primaryColumns.status.horizontalAlignment": "TEMPLATE",
      "primaryColumns.status.isCellVisible": "TEMPLATE",
      "primaryColumns.status.computedValue": "TEMPLATE",
      "primaryColumns.task.cellBackground": "TEMPLATE",
      "primaryColumns.task.textColor": "TEMPLATE",
      "primaryColumns.task.verticalAlignment": "TEMPLATE",
      "primaryColumns.task.fontStyle": "TEMPLATE",
      "primaryColumns.task.textSize": "TEMPLATE",
      "primaryColumns.task.horizontalAlignment": "TEMPLATE",
      "primaryColumns.task.isCellVisible": "TEMPLATE",
      "primaryColumns.task.computedValue": "TEMPLATE",
      "primaryColumns.step.cellBackground": "TEMPLATE",
      "primaryColumns.step.textColor": "TEMPLATE",
      "primaryColumns.step.verticalAlignment": "TEMPLATE",
      "primaryColumns.step.fontStyle": "TEMPLATE",
      "primaryColumns.step.textSize": "TEMPLATE",
      "primaryColumns.step.horizontalAlignment": "TEMPLATE",
      "primaryColumns.step.isCellVisible": "TEMPLATE",
      "primaryColumns.step.computedValue": "TEMPLATE",
      primaryColumnId: "TEMPLATE",
      defaultSearchText: "TEMPLATE",
      defaultSelectedRow: "TEMPLATE",
      compactMode: "TEMPLATE",
      isVisible: "TEMPLATE",
      animateLoading: "TEMPLATE",
      isSortable: "TEMPLATE",
      isVisibleSearch: "TEMPLATE",
      isVisibleFilters: "TEMPLATE",
      isVisibleDownload: "TEMPLATE",
      isVisiblePagination: "TEMPLATE",
      delimiter: "TEMPLATE",
    },
    triggerPaths: {
      "primaryColumns.action.onClick": true,
      onRowSelected: true,
      onPageChange: true,
      onPageSizeChange: true,
      onSearchTextChanged: true,
      onSort: true,
    },
    validationPaths: {
      tableData: {
        type: "OBJECT_ARRAY",
        params: {
          default: [],
        },
      },
      "primaryColumns.action.buttonLabelColor": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
      },
      "primaryColumns.action.buttonColor": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
      },
      "primaryColumns.action.isDisabled": {
        type: "TABLE_PROPERTY",
        params: {
          type: "BOOLEAN",
        },
      },
      "primaryColumns.action.isCellVisible": {
        type: "TABLE_PROPERTY",
        params: {
          type: "BOOLEAN",
        },
      },
      "primaryColumns.status.cellBackground": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
      },
      "primaryColumns.status.textColor": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
      },
      "primaryColumns.status.verticalAlignment": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            allowedValues: ["TOP", "CENTER", "BOTTOM"],
          },
        },
      },
      "primaryColumns.status.fontStyle": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
        },
      },
      "primaryColumns.status.textSize": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            allowedValues: [
              "HEADING1",
              "HEADING2",
              "HEADING3",
              "PARAGRAPH",
              "PARAGRAPH2",
            ],
          },
        },
      },
      "primaryColumns.status.horizontalAlignment": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            allowedValues: ["LEFT", "CENTER", "RIGHT"],
          },
        },
      },
      "primaryColumns.status.isCellVisible": {
        type: "TABLE_PROPERTY",
        params: {
          type: "BOOLEAN",
        },
      },
      "primaryColumns.task.cellBackground": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
      },
      "primaryColumns.task.textColor": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
      },
      "primaryColumns.task.verticalAlignment": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            allowedValues: ["TOP", "CENTER", "BOTTOM"],
          },
        },
      },
      "primaryColumns.task.fontStyle": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
        },
      },
      "primaryColumns.task.textSize": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            allowedValues: [
              "HEADING1",
              "HEADING2",
              "HEADING3",
              "PARAGRAPH",
              "PARAGRAPH2",
            ],
          },
        },
      },
      "primaryColumns.task.horizontalAlignment": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            allowedValues: ["LEFT", "CENTER", "RIGHT"],
          },
        },
      },
      "primaryColumns.task.isCellVisible": {
        type: "TABLE_PROPERTY",
        params: {
          type: "BOOLEAN",
        },
      },
      "primaryColumns.step.cellBackground": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
      },
      "primaryColumns.step.textColor": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            regex: {},
          },
        },
      },
      "primaryColumns.step.verticalAlignment": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            allowedValues: ["TOP", "CENTER", "BOTTOM"],
          },
        },
      },
      "primaryColumns.step.fontStyle": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
        },
      },
      "primaryColumns.step.textSize": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            allowedValues: [
              "HEADING1",
              "HEADING2",
              "HEADING3",
              "PARAGRAPH",
              "PARAGRAPH2",
            ],
          },
        },
      },
      "primaryColumns.step.horizontalAlignment": {
        type: "TABLE_PROPERTY",
        params: {
          type: "TEXT",
          params: {
            allowedValues: ["LEFT", "CENTER", "RIGHT"],
          },
        },
      },
      "primaryColumns.step.isCellVisible": {
        type: "TABLE_PROPERTY",
        params: {
          type: "BOOLEAN",
        },
      },
      primaryColumnId: {
        type: "TEXT",
      },
      defaultSearchText: {
        type: "TEXT",
      },
      defaultSelectedRow: {
        type: "FUNCTION",
        params: {
          expected: {
            type: "Index of row(s)",
            example: "0 | [0, 1]",
            autocompleteDataType: "STRING",
          },
          fnString:
            'function defaultSelectedRowValidation(value, props, _) {\n  if (props) {\n    if (props.multiRowSelection) {\n      if (_.isString(value)) {\n        var trimmed = value.trim();\n\n        try {\n          var parsedArray = JSON.parse(trimmed);\n\n          if (Array.isArray(parsedArray)) {\n            var sanitized = parsedArray.filter(entry => {\n              return Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1;\n            });\n            return {\n              isValid: true,\n              parsed: sanitized\n            };\n          } else {\n            throw Error("Not a stringified array");\n          }\n        } catch (e) {\n          // If cannot be parsed as an array\n          var arrayEntries = trimmed.split(",");\n          var result = [];\n          arrayEntries.forEach(entry => {\n            if (Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1) {\n              if (!_.isNil(entry)) result.push(parseInt(entry, 10));\n            }\n          });\n          return {\n            isValid: true,\n            parsed: result\n          };\n        }\n      }\n\n      if (Array.isArray(value)) {\n        var _sanitized = value.filter(entry => {\n          return Number.isInteger(parseInt(entry, 10)) && parseInt(entry, 10) > -1;\n        });\n\n        return {\n          isValid: true,\n          parsed: _sanitized\n        };\n      }\n\n      if (Number.isInteger(value) && value > -1) {\n        return {\n          isValid: true,\n          parsed: [value]\n        };\n      }\n\n      return {\n        isValid: false,\n        parsed: [],\n        message: "This value does not match type: number[]"\n      };\n    } else {\n      try {\n        var _value = value;\n\n        if (_value === "") {\n          return {\n            isValid: true,\n            parsed: undefined\n          };\n        }\n\n        if (Number.isInteger(parseInt(_value, 10)) && parseInt(_value, 10) > -1) return {\n          isValid: true,\n          parsed: parseInt(_value, 10)\n        };\n        return {\n          isValid: true,\n          parsed: -1\n        };\n      } catch (e) {\n        return {\n          isValid: true,\n          parsed: -1\n        };\n      }\n    }\n  }\n\n  return {\n    isValid: true,\n    parsed: value\n  };\n}',
        },
      },
      isVisible: {
        type: "BOOLEAN",
      },
      animateLoading: {
        type: "BOOLEAN",
      },
      isSortable: {
        type: "BOOLEAN",
        params: {
          default: true,
        },
      },
      isVisibleSearch: {
        type: "BOOLEAN",
      },
      isVisibleFilters: {
        type: "BOOLEAN",
      },
      isVisibleDownload: {
        type: "BOOLEAN",
      },
      isVisiblePagination: {
        type: "BOOLEAN",
      },
      delimiter: {
        type: "TEXT",
      },
    },
    ENTITY_TYPE: "WIDGET",
    privateWidgets: {},
  },
  Text1: {
    widgetName: "Text1",
    displayName: "Text",
    iconSVG: "/static/media/icon.97c59b52.svg",
    topRow: 44,
    bottomRow: 48,
    parentRowSpace: 10,
    type: "TEXT_WIDGET",
    hideCard: false,
    animateLoading: true,
    parentColumnSpace: 12.5625,
    leftColumn: 25,
    shouldTruncate: false,
    truncateButtonColor: "#FFC13D",
    text: "Label",
    key: "hd8x1ymrq0",
    rightColumn: 41,
    textAlign: "LEFT",
    widgetId: "ha99zcctgq",
    isVisible: true,
    fontStyle: "BOLD",
    textColor: "#231F20",
    shouldScroll: false,
    version: 1,
    parentId: "0",
    renderMode: "CANVAS",
    isLoading: false,
    fontSize: "PARAGRAPH",
    value: "{{ Text1.text }}",
    defaultProps: {},
    defaultMetaProps: [],
    dynamicBindingPathList: [
      {
        key: "value",
      },
    ],
    logBlackList: {
      value: true,
    },
    meta: {},
    propertyOverrideDependency: {},
    overridingPropertyPaths: {},
    reactivePaths: {
      value: "TEMPLATE",
      text: "TEMPLATE",
      isVisible: "TEMPLATE",
      animateLoading: "TEMPLATE",
      disableLink: "TEMPLATE",
      backgroundColor: "TEMPLATE",
      textColor: "TEMPLATE",
      borderColor: "TEMPLATE",
      borderWidth: "TEMPLATE",
      fontSize: "TEMPLATE",
      fontStyle: "TEMPLATE",
      textAlign: "TEMPLATE",
    },
    bindingPaths: {
      text: "TEMPLATE",
      isVisible: "TEMPLATE",
      animateLoading: "TEMPLATE",
      disableLink: "TEMPLATE",
      backgroundColor: "TEMPLATE",
      textColor: "TEMPLATE",
      borderColor: "TEMPLATE",
      borderWidth: "TEMPLATE",
      fontSize: "TEMPLATE",
      fontStyle: "TEMPLATE",
      textAlign: "TEMPLATE",
    },
    triggerPaths: {},
    validationPaths: {
      text: {
        type: "TEXT",
      },
      isVisible: {
        type: "BOOLEAN",
      },
      animateLoading: {
        type: "BOOLEAN",
      },
      disableLink: {
        type: "BOOLEAN",
      },
      backgroundColor: {
        type: "TEXT",
        params: {
          regex: {},
          expected: {
            type: "string (HTML color name or HEX value)",
            example: "red | #9C0D38",
            autocompleteDataType: "STRING",
          },
        },
      },
      textColor: {
        type: "TEXT",
        params: {
          regex: {},
        },
      },
      borderColor: {
        type: "TEXT",
      },
      borderWidth: {
        type: "NUMBER",
      },
      fontSize: {
        type: "TEXT",
        params: {
          allowedValues: [
            "HEADING1",
            "HEADING2",
            "HEADING3",
            "PARAGRAPH",
            "PARAGRAPH2",
          ],
        },
      },
      fontStyle: {
        type: "TEXT",
      },
      textAlign: {
        type: "TEXT",
      },
    },
    ENTITY_TYPE: "WIDGET",
    privateWidgets: {},
  },
  pageList: [
    {
      pageName: "Page1",
      pageId: "6249dc390febc466b542e3a0",
      isDefault: true,
      isHidden: false,
    },
  ],
  appsmith: {
    user: {
      email: "rathod@appsmith.com",
      organizationIds: [
        "6218a61972ccd9145ec78c57",
        "621913df0276eb01d22fec44",
        "60caf8edb1e47a1315f0c48f",
        "62285ad3dd4fa44bed2b637a",
        "6241aad814d46d3d1018114c",
        "6229be1ea284dc7417fb4f44",
      ],
      username: "rathod@appsmith.com",
      name: "Rishabh",
      commentOnboardingState: "RESOLVED",
      role: "engineer",
      useCase: "personal project",
      enableTelemetry: false,
      emptyInstance: false,
      accountNonExpired: true,
      accountNonLocked: true,
      credentialsNonExpired: true,
      isAnonymous: false,
      isEnabled: true,
      isSuperUser: false,
      isConfigurable: true,
    },
    URL: {
      fullPath:
        "https://dev.appsmith.com/applications/6249dc390febc466b542e39d/pages/6249dc390febc466b542e3a0/edit?a=b",
      host: "dev.appsmith.com",
      hostname: "dev.appsmith.com",
      queryParams: {
        a: "b",
      },
      protocol: "https:",
      pathname:
        "/applications/6249dc390febc466b542e39d/pages/6249dc390febc466b542e3a0/edit",
      port: "",
      hash: "",
    },
    store: {},
    geolocation: {
      canBeRequested: true,
    },
    mode: "EDIT",
    ENTITY_TYPE: "APPSMITH",
  },
};
