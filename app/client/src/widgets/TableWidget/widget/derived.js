/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedRow: (props, moment, _) => {
    let selectedRowIndices = [];
    if (
      Array.isArray(props.selectedRowIndices) &&
      props.selectedRowIndices.every((el) => typeof el === "number")
    ) {
      selectedRowIndices = props.selectedRowIndices;
    } else if (typeof props.selectedRowIndices === "number") {
      selectedRowIndices = [props.selectedRowIndices];
    }
    let selectedRowIndex;
    if (props.multiRowSelection) {
      selectedRowIndex = selectedRowIndices.length
        ? selectedRowIndices[selectedRowIndices.length - 1]
        : -1;
    } else {
      selectedRowIndex =
        props.selectedRowIndex === undefined ||
        Number.isNaN(parseInt(props.selectedRowIndex))
          ? -1
          : parseInt(props.selectedRowIndex);
    }
    const filteredTableData =
      props.filteredTableData || props.sanitizedTableData || [];
    const internalKeysToOmit = ["__originalIndex__", "__primaryKey__"];
    if (selectedRowIndex === -1) {
      const emptyRow = { ...filteredTableData[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return _.omit(emptyRow, internalKeysToOmit);
    }
    const selectedRow = { ...filteredTableData[selectedRowIndex] };
    return _.omit(selectedRow, internalKeysToOmit);
  },
  //
  getTriggeredRow: (props, moment, _) => {
    const triggeredRowIndex =
      props.triggeredRowIndex === undefined ||
      Number.isNaN(parseInt(props.triggeredRowIndex))
        ? -1
        : parseInt(props.triggeredRowIndex);
    const tableData = props.sanitizedTableData || [];
    const internalKeysToOmit = ["__originalIndex__", "__primaryKey__"];
    if (triggeredRowIndex === -1) {
      const emptyRow = { ...tableData[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return _.omit(emptyRow, internalKeysToOmit);
    }
    const triggeredRow = { ...tableData[triggeredRowIndex] };
    return _.omit(triggeredRow, internalKeysToOmit);
  },
  //
  getSelectedRows: (props, moment, _) => {
    const selectedRowIndices = Array.isArray(props.selectedRowIndices)
      ? props.selectedRowIndices
      : [];
    const filteredTableData =
      props.filteredTableData || props.sanitizedTableData || [];

    const internalKeysToOmit = ["__originalIndex__", "__primaryKey__"];
    const selectedRows = selectedRowIndices.map((ind) =>
      _.omit(filteredTableData[ind], internalKeysToOmit),
    );
    return selectedRows;
  },
  //
  getPageSize: (props, moment, _) => {
    const TABLE_SIZES = {
      DEFAULT: {
        COLUMN_HEADER_HEIGHT: 32,
        TABLE_HEADER_HEIGHT: 38,
        ROW_HEIGHT: 40,
        ROW_FONT_SIZE: 14,
      },
      SHORT: {
        COLUMN_HEADER_HEIGHT: 32,
        TABLE_HEADER_HEIGHT: 38,
        ROW_HEIGHT: 20,
        ROW_FONT_SIZE: 12,
      },
      TALL: {
        COLUMN_HEADER_HEIGHT: 32,
        TABLE_HEADER_HEIGHT: 38,
        ROW_HEIGHT: 60,
        ROW_FONT_SIZE: 18,
      },
    };
    const compactMode = props.compactMode || "DEFAULT";
    const componentHeight =
      (props.bottomRow - props.topRow) * props.parentRowSpace - 10;
    const tableSizes = TABLE_SIZES[compactMode];
    let pageSize = Math.floor(
      (componentHeight -
        tableSizes.TABLE_HEADER_HEIGHT -
        tableSizes.COLUMN_HEADER_HEIGHT) /
        tableSizes.ROW_HEIGHT,
    );
    if (
      componentHeight -
        (tableSizes.TABLE_HEADER_HEIGHT +
          tableSizes.COLUMN_HEADER_HEIGHT +
          tableSizes.ROW_HEIGHT * pageSize) >
      0
    ) {
      pageSize += 1;
    }
    return pageSize;
  },
  //
  getSanitizedTableData: (props, moment, _) => {
    const separatorRegex = /\W+/;

    if (props.tableData && Array.isArray(props.tableData)) {
      return props.tableData.map((entry) => {
        const sanitizedData = {};

        for (const [key, value] of Object.entries(entry)) {
          let sanitizedKey = key
            .split(separatorRegex)
            .join("_")
            .slice(0, 200);
          sanitizedKey = _.isNaN(Number(sanitizedKey))
            ? sanitizedKey
            : `_${sanitizedKey}`;
          sanitizedData[sanitizedKey] = value;
        }
        return sanitizedData;
      });
    }
    return [];
  },
  //
  getTableColumns: (props, moment, _) => {
    let columns = [];
    let allColumns = Object.assign({}, props.primaryColumns || {});
    const data = props.sanitizedTableData || [];
    if (data.length > 0) {
      const columnIdsFromData = [];
      for (let i = 0, tableRowCount = data.length; i < tableRowCount; i++) {
        const row = data[i];
        for (const key in row) {
          if (!columnIdsFromData.includes(key)) {
            columnIdsFromData.push(key);
          }
        }
      }

      columnIdsFromData.forEach((id) => {
        if (!allColumns[id]) {
          const currIndex = Object.keys(allColumns).length;
          allColumns[id] = {
            index: currIndex,
            width: 150,
            id,
            horizontalAlignment: "LEFT",
            verticalAlignment: "CENTER",
            columnType: "text",
            textColor: "#231F20",
            textSize: "PARAGRAPH",
            fontStyle: "REGULAR",
            enableFilter: true,
            enableSort: true,
            isVisible: true,
            isDerived: false,
            label: id,
            computedValue: props.sanitizedTableData.map(
              (currentRow) => currentRow[id],
            ),
          };
        }
      });
      const existingColumnIds = Object.keys(allColumns);
      const idsNotToShow = _.without(existingColumnIds, ...columnIdsFromData)
        .map((idNotInData) => {
          if (allColumns[idNotInData] && !allColumns[idNotInData].isDerived)
            return idNotInData;
          return undefined;
        })
        .filter(Boolean);
      idsNotToShow.forEach((id) => delete allColumns[id]);
    }
    const sortColumn = props.sortOrder.column;
    const sortOrder = props.sortOrder.order === "asc" ? true : false;
    if (
      props.columnOrder &&
      Array.isArray(props.columnOrder) &&
      props.columnOrder.length > 0
    ) {
      const newColumnsInOrder = {};

      _.uniq(props.columnOrder).forEach((id, index) => {
        if (allColumns[id])
          newColumnsInOrder[id] = { ...allColumns[id], index };
      });
      const remaining = _.without(
        Object.keys(allColumns),
        ...Object.keys(newColumnsInOrder),
      );
      const len = Object.keys(newColumnsInOrder).length;
      if (remaining && remaining.length > 0) {
        remaining.forEach((id, index) => {
          newColumnsInOrder[id] = { ...allColumns[id], index: len + index };
        });
      }
      allColumns = newColumnsInOrder;
    }
    const allColumnProperties = Object.values(allColumns);
    for (let index = 0; index < allColumnProperties.length; index++) {
      const columnProperties = { ...allColumnProperties[index] };
      columnProperties.isAscOrder =
        columnProperties.id === sortColumn ? sortOrder : undefined;
      const columnData = columnProperties;
      columns.push(columnData);
    }
    return columns.filter((column) => column.id);
  },
  //
  getFilteredTableData: (props, moment, _) => {
    if (!props.sanitizedTableData || !props.sanitizedTableData.length) {
      return [];
    }
    let derivedTableData = [...props.sanitizedTableData];
    if (props.primaryColumns && _.isPlainObject(props.primaryColumns)) {
      const primaryColumns = props.primaryColumns;
      const columnIds = Object.keys(props.primaryColumns);
      columnIds.forEach((columnId) => {
        const column = primaryColumns[columnId];
        let computedValues = [];

        if (column && column.computedValue) {
          if (_.isString(column.computedValue)) {
            try {
              computedValues = JSON.parse(column.computedValue);
            } catch (e) {
              console.error(
                e,
                "Error parsing column value: ",
                column.computedValue,
              );
            }
          } else if (Array.isArray(column.computedValue)) {
            computedValues = column.computedValue;
          }
        }

        if (computedValues.length === 0) {
          if (props.derivedColumns) {
            const derivedColumn = props.derivedColumns[columnId];
            if (derivedColumn) {
              computedValues = Array(derivedTableData.length).fill("");
            }
          }
        }

        for (let index = 0; index < computedValues.length; index++) {
          derivedTableData[index] = {
            ...derivedTableData[index],
            [columnId]: computedValues[index],
          };
        }
      });
    }

    derivedTableData = derivedTableData.map((item, index) => ({
      ...item,
      __originalIndex__: index,
      __primaryKey__: props.primaryColumnId
        ? item[props.primaryColumnId]
        : undefined,
    }));
    const columns = props.tableColumns;
    const sortedColumn = props.sortOrder.column;
    let sortedTableData;
    if (sortedColumn) {
      const sortOrder = props.sortOrder.order === "asc" ? true : false;
      const column = columns.find((column) => column.id === sortedColumn);
      const columnType =
        column && column.columnType ? column.columnType : "text";
      const inputFormat = column.inputFormat;
      const isEmptyOrNil = (value) => {
        return _.isNil(value) || value === "";
      };
      sortedTableData = derivedTableData.sort((a, b) => {
        if (_.isPlainObject(a) && _.isPlainObject(b)) {
          if (isEmptyOrNil(a[sortedColumn]) || isEmptyOrNil(b[sortedColumn])) {
            /* push null, undefined and "" values to the bottom. */
            return isEmptyOrNil(a[sortedColumn]) ? 1 : -1;
          } else {
            switch (columnType) {
              case "number":
                return sortOrder
                  ? Number(a[sortedColumn]) > Number(b[sortedColumn])
                    ? 1
                    : -1
                  : Number(b[sortedColumn]) > Number(a[sortedColumn])
                  ? 1
                  : -1;
              case "date":
                try {
                  return sortOrder
                    ? moment(a[sortedColumn], inputFormat).isAfter(
                        moment(b[sortedColumn], inputFormat),
                      )
                      ? 1
                      : -1
                    : moment(b[sortedColumn], inputFormat).isAfter(
                        moment(a[sortedColumn], inputFormat),
                      )
                    ? 1
                    : -1;
                } catch (e) {
                  return -1;
                }
              default:
                return sortOrder
                  ? a[sortedColumn].toString().toUpperCase() >
                    b[sortedColumn].toString().toUpperCase()
                    ? 1
                    : -1
                  : b[sortedColumn].toString().toUpperCase() >
                    a[sortedColumn].toString().toUpperCase()
                  ? 1
                  : -1;
            }
          }
        } else {
          return sortOrder ? 1 : 0;
        }
      });
    } else {
      sortedTableData = [...derivedTableData];
    }
    const ConditionFunctions = {
      isExactly: (a, b) => {
        return a.toString() === b.toString();
      },
      empty: (a) => {
        if (a === null || a === undefined || a === "") return true;
        return _.isEmpty(a.toString());
      },
      notEmpty: (a) => {
        return a !== "" && a !== undefined && a !== null;
      },
      notEqualTo: (a, b) => {
        return a.toString() !== b.toString();
      },
      isEqualTo: (a, b) => {
        return a.toString() === b.toString();
      },
      lessThan: (a, b) => {
        const numericB = Number(b);
        const numericA = Number(a);
        return numericA < numericB;
      },
      lessThanEqualTo: (a, b) => {
        const numericB = Number(b);
        const numericA = Number(a);
        return numericA <= numericB;
      },
      greaterThan: (a, b) => {
        const numericB = Number(b);
        const numericA = Number(a);
        return numericA > numericB;
      },
      greaterThanEqualTo: (a, b) => {
        const numericB = Number(b);
        const numericA = Number(a);
        return numericA >= numericB;
      },
      contains: (a, b) => {
        try {
          return a
            .toString()
            .toLowerCase()
            .includes(b.toString().toLowerCase());
        } catch (e) {
          return false;
        }
      },
      doesNotContain: (a, b) => {
        try {
          return !a
            .toString()
            .toLowerCase()
            .includes(b.toString().toLowerCase());
        } catch (e) {
          return false;
        }
      },
      startsWith: (a, b) => {
        try {
          return (
            a
              .toString()
              .toLowerCase()
              .indexOf(b.toString().toLowerCase()) === 0
          );
        } catch (e) {
          return false;
        }
      },
      endsWith: (a, b) => {
        try {
          const _a = a.toString().toLowerCase();
          const _b = b.toString().toLowerCase();

          return _a.length === _a.lastIndexOf(_b) + _b.length;
        } catch (e) {
          return false;
        }
      },
      is: (a, b) => {
        return moment(a).isSame(moment(b), "minute");
      },
      isNot: (a, b) => {
        return !moment(a).isSame(moment(b), "minute");
      },
      isAfter: (a, b) => {
        return moment(a).isAfter(moment(b), "minute");
      },
      isBefore: (a, b) => {
        return moment(a).isBefore(moment(b), "minute");
      },
    };

    const getSearchKey = () => {
      if (
        props.searchText &&
        (!props.onSearchTextChanged || props.enableClientSideSearch)
      ) {
        return props.searchText.toLowerCase();
      }
      return "";
    };

    const finalTableData = sortedTableData.filter((item) => {
      const searchFound = getSearchKey()
        ? Object.values(item)
            .join(", ")
            .toLowerCase()
            .includes(getSearchKey())
        : true;
      if (!searchFound) return false;
      if (!props.filters || props.filters.length === 0) return true;
      const filters = props.filters;
      const filterOperator = filters.length >= 2 ? filters[1].operator : "OR";
      let filter = filterOperator === "AND";
      for (let i = 0; i < filters.length; i++) {
        let result = true;
        try {
          const conditionFunction = ConditionFunctions[filters[i].condition];
          if (conditionFunction) {
            result = conditionFunction(
              item[filters[i].column],
              filters[i].value,
            );
          }
        } catch (e) {
          console.error(e);
        }
        const filterValue = result;
        filter =
          filterOperator === "AND"
            ? filter && filterValue
            : filter || filterValue;
      }
      return filter;
    });
    return finalTableData;
  },
  //
};
