/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedRow: (props, moment, _) => {
    let selectedRowIndex = -1;
    const {
      selectedRowIndices,
      filteredTableData,
      sanitizedTableData,
      multiRowSelection,
    } = props;

    /*
     * If multiRowSelection is turned on, use the last index to
     * populate the selectedRowIndex
     */
    if (multiRowSelection) {
      // check if selectedRowIndices is an array & every item is a number
      if (
        _.isArray(selectedRowIndices) &&
        selectedRowIndices.length &&
        selectedRowIndices.every((i) => _.isNumber(i))
      ) {
        selectedRowIndex = selectedRowIndices[selectedRowIndices.length - 1];
      } else if (_.isNumber(selectedRowIndices)) {
        selectedRowIndex = selectedRowIndices;
      }
    } else if (!_.isNil(props.selectedRowIndex) && !_.isNaN(parseInt(props.selectedRowIndex))) {
      selectedRowIndex = parseInt(props.selectedRowIndex);
    }

    const rows = filteredTableData || sanitizedTableData || [];
    let selectedRow;
    
    //Note(Balaji): Need to include customColumn values in the selectedRow (select, rating)
    // It should have updated values.
    if (selectedRowIndex > -1) {
      selectedRow = { ...rows[selectedRowIndex] };
    } else {
      /*
       *  If selectedRowIndex is not a valid index, selectedRow should
       *  proper row structure with empty string values 
       */
      selectedRow = {};
      Object.keys(rows[0]).forEach((key) => {
        selectedRow[key] = "";
      });
    }

    return selectedRow;
  },
  //
  getTriggeredRow: (props, moment, _) => {
    let index = -1;
    const { triggeredRowIndex, sanitizedTableData } = props;
    const parsedTriggeredRowIndex = parseInt(triggeredRowIndex)

    if (!_.isNaN(parsedTriggeredRowIndex)) {
      index = parsedTriggeredRowIndex;
    }
    
    //TODO(balaji): Should check if we need to include filteredTableData
    const rows = sanitizedTableData || [];
    const triggeredRow;
    
    //Note(Balaji): Need to include customColumn values in the triggeredRow (select, rating)
    // It should have updated values.
    if (index > -1) {
      triggeredRow = { ...rows[index] };
    } else {
      /*
       *  If triggeredRowIndex is not a valid index, triggeredRow should
       *  have proper row structure with empty string values 
       */
      triggeredRow = {};
      Object.keys(rows[0]).forEach((key) => {
        triggeredRow[key] = "";
      });
    }

    return triggeredRow;
  },
  //
  getSelectedRows: (props, moment, _) => {
    const { selectedRowIndices, filteredTableData, sanitizedTableData } = props;
    let indices = [];

    if (
      _.isArray(selectedRowIndices) &&
      selectedRowIndices.every((i) => _.isNumber(i))
    ) {
      indices = selectedRowIndices;
    }

    const rows = filteredTableData || sanitizedTableData || [];

    return indices.map((index) => rows[index]);
  },
  //
  getPageSize: (props, moment, _) => {
    //TODO(Balaji): Refactor this
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
    const { tableData } = props;

    //TODO(Balaji): We need to take the inline edited cells and custom column values
    // from meta and inject that into sanitised data
    if (tableData && _.isArray(tableData)) {
      return tableData;
    } else {
      return [];
    }
  },
  //
  getTableColumns: (props, moment, _) => {
    const { sanitizedTableData, primaryColumns, sortOrder, columnOrder } = props;
    const data = sanitizedTableData || [];

    let columns = [];
    let existingColumns = Object.assign({}, primaryColumns || {});

    if (data.length > 0) {
      const columnIdSet = new Set();

      data.forEach((row) => {
        Object.keys(row).forEach((key) => {
          columnIdSet.add(key);
        });
      });

      const newColumnIds = Array.from(columnIdSet);

      // Create columns that are not already present in the primaryColumns list
      newColumnIds.forEach((id) => {
        if (!existingColumns[id]) {
          const currIndex = Object.keys(existingColumns).length;
          allColumns[id] = {
            index: currIndex,
            width: 150,
            accessor: id,
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

      /* We need to delete the columns which are not present the 
       * new sanitizedTableData from primary columns.
       */
      const existingColumnIds = Object.keys(existingColumns);
      
      _.without(existingColumnIds, ...newColumnIds)
        .map((excludedId) => {
          /* only remove the non derived columns */
          if (existingColumns[excludedId] && !existingColumns[excludedId].isDerived) {
            return excludedId;
          }
        })
        .filter(Boolean)
        .forEach((id) => delete existingColumns[id]);
    }

    const sortByColumn = sortOrder.column;
    const isAscOrder = sortOrder.order === "asc";
    
    if (_.isArray(columnOrder) && columnOrder.length > 0) {
      const newColumnOrder = {};

      _.uniq(columnOrder)
        .forEach((id, index) => {
          if (existingColumns[id]) {
            newColumnOrder[id] = { ...allColumns[id], index };
          }
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
