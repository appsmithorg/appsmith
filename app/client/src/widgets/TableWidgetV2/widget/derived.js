/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedRow: (props, moment, _) => {
    let index = -1;
    const {
      filteredTableData,
      multiRowSelection,
      sanitizedTableData,
      selectedRowIndex,
      selectedRowIndices,
    } = props;

    /*
     * If multiRowSelection is turned on, use the last index to
     * populate the selectedRowIndex
     */
    if (multiRowSelection) {
      if (
        _.isArray(selectedRowIndices) &&
        selectedRowIndices.length &&
        selectedRowIndices.every((i) => _.isNumber(i))
      ) {
        index = selectedRowIndices[selectedRowIndices.length - 1];
      } else if (_.isNumber(selectedRowIndices)) {
        index = selectedRowIndices;
      }
    } else if (
      !_.isNil(selectedRowIndex) &&
      !_.isNaN(parseInt(selectedRowIndex))
    ) {
      index = parseInt(selectedRowIndex);
    }

    const rows = filteredTableData || sanitizedTableData || [];
    let selectedRow;

    //Note(Balaji): Need to include customColumn values in the selectedRow (select, rating)
    // It should have updated values.
    if (index > -1) {
      selectedRow = { ...rows[index] };
    } else {
      /*
       *  If index is not a valid, selectedRow should have
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
    const { sanitizedTableData, triggeredRowIndex } = props;
    const parsedTriggeredRowIndex = parseInt(triggeredRowIndex);

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
    const { filteredTableData, sanitizedTableData, selectedRowIndices } = props;
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
    /*
     * existing columns - primaryColumns
     * new columns - sanitizedTableData columns
     */
    const {
      columnOrder,
      primaryColumns,
      sanitizedTableData,
      sortOrder,
    } = props;
    const data = sanitizedTableData || [];

    let columns = [];

    /* Shallow copy primaryColumns */
    let existingColumns = Object.assign({}, primaryColumns || {});

    /*
     * Add colummns from sanitizedTableData to existingColumns if they're not already preset
     * Remove columns from existingColumns if they're not present in the sanitizedTableData
     */
    if (data.length > 0) {
      const columnIdSet = new Set();

      // Create a unigue column ids list from newColumns
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
          existingColumns[id] = {
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

      /* We need to delete the columns, which are not present in the
       * new sanitizedTableData, from existing columns.
       */
      const existingColumnIds = Object.keys(existingColumns);

      _.without(existingColumnIds, ...newColumnIds)
        .filter((excludedId) => {
          /*
           * only remove the non derived columns, since sanitized tabledata
           * doesn't have the derived columns
           */
          const column = existingColumns[excludedId];

          return column && !column.isDerived;
        })
        .forEach((id) => delete existingColumns[id]);
    }

    /*
     * Need to reassign index keys to columns in existing columns
     * since we have added/removed columns from it
     */
    if (_.isArray(columnOrder) && columnOrder.length > 0) {
      const newColumnsInOrder = {};

      let index = 0;

      /* Assign index for the columns that are already present */
      _.uniq(columnOrder).forEach((columnId) => {
        if (existingColumns[columnId]) {
          newColumnsInOrder[columnId] = {
            ...existingColumns[columnId],
            index,
          };
          index++;
        }
      });

      const len = Object.keys(newColumnsInOrder).length;

      /* Assign index for the new columns */
      _.without(
        Object.keys(existingColumns),
        ...Object.keys(newColumnsInOrder),
      ).forEach((id, index) => {
        newColumnsInOrder[id] = { ...existingColumns[id], index: len + index };
      });

      existingColumns = newColumnsInOrder;
    }

    const sortByColumn = sortOrder.column;
    const isAscOrder = sortOrder.order === "asc";

    /* set sorting flags and convert the existing columns into an array */
    Object.values(existingColumns).forEach((column) => {
      /* guard to not allow columns without id */
      if (column.id) {
        column.isAscOrder = column.id === sortByColumn ? isAscOrder : undefined;
        columns.push(column);
      }
    });

    return columns;
  },
  //
  getFilteredTableData: (props, moment, _) => {
    /* Make a shallow copy */
    const sanitizedTableData = [...props.sanitizedTableData];
    const {
      derivedColumns,
      primaryColumnId,
      primaryColumns,
      sortOrder,
      tableColumns,
    } = props;

    if (!sanitizedTableData || !sanitizedTableData.length) {
      return [];
    }

    /* extend sanitizedTableData with values from
     *  - computedValues, in case of normal column
     *  - empty values, in case of derived column
     */
    if (primaryColumns && _.isPlainObject(primaryColumns)) {
      Object.entries(primaryColumns).forEach(([id, column]) => {
        let computedValues = [];

        if (column && column.computedValue) {
          if (_.isString(column.computedValue)) {
            try {
              computedValues = JSON.parse(column.computedValue);
            } catch (e) {
              console.error(
                e,
                "Error parsing column computedValue: ",
                column.computedValue,
              );
            }
          } else if (_.isArray(column.computedValue)) {
            computedValues = column.computedValue;
          }
        }

        /* for derived columns inject empty strings */
        if (computedValues.length === 0) {
          if (props.derivedColumns) {
            if (derivedColumns[id]) {
              computedValues = Array(sanitizedTableData.length).fill("");
            }
          }
        }

        computedValues.forEach((computedValue, index) => {
          sanitizedTableData[index] = {
            ...sanitizedTableData[index],
            [id]: computedValue,
          };
        });
      });
    }

    /* Populate meta keys (__originalIndex__, __primaryKey__) */
    sanitizedTableData = sanitizedTableData.map((row, index) => ({
      ...row,
      __originalIndex__: index,
      __primaryKey__: primaryColumnId ? row[primaryColumnId] : undefined,
    }));

    const columns = tableColumns;
    const sortByColumnId = sortOrder.column;

    let sortedTableData;

    if (sortByColumnId) {
      const sortBycolumn = columns.find(
        (column) => column.id === sortByColumnId,
      );
      const columnType =
        sortBycolumn && sortBycolumn.columnType
          ? sortBycolumn.columnType
          : "text";
      const inputFormat = sortBycolumn.inputFormat;
      const isEmptyOrNil = (value) => {
        return _.isNil(value) || value === "";
      };
      const isAscOrder = sortOrder.order === "asc";
      const sortByOrder = (isAGreaterThanB) => {
        if (isAGreaterThanB) {
          return isAscOrder ? 1 : -1;
        } else {
          return isAscOrder ? -1 : 1;
        }
      };
      
      sortedTableData = sanitizedTableData.sort((a, b) => {
        if (_.isPlainObject(a) && _.isPlainObject(b)) {
          if (
            isEmptyOrNil(a[sortByColumnId]) ||
            isEmptyOrNil(b[sortByColumnId])
          ) {
            /* push null, undefined and "" values to the bottom. */
            return isEmptyOrNil(a[sortByColumnId]) ? 1 : -1;
          } else {
            switch (columnType) {
              case "number":
                return sortByOrder(
                  Number(a[sortByColumnId]) > Number(b[sortByColumnId]),
                );
              case "date":
                try {
                  return sortByOrder(
                    moment(a[sortByColumnId], inputFormat).isAfter(
                      moment(b[sortByColumnId], inputFormat),
                    ),
                  );
                } catch (e) {
                  return -1;
                }
              default:
                return sortByOrder(
                  a[sortByColumnId].toString().toLowerCase() >
                    b[sortByColumnId].toString().toLowerCase(),
                );
            }
          }
        } else {
          return isAscOrder ? 1 : 0;
        }
      });
    } else {
      sortedTableData = [...sanitizedTableData];
    }

    const ConditionFunctions = {
      isExactly: (a, b) => {
        return a.toString() === b.toString();
      },
      empty: (a) => {
        return _.isNil(a) || _.isEmpty(a.toString());
      },
      notEmpty: (a) => {
        return !_.isNil(a) && _.isEmpty(a.toString());
      },
      notEqualTo: (a, b) => {
        return a.toString() !== b.toString();
      },
      /* Note: Duplicate of isExactly */
      isEqualTo: (a, b) => {
        return a.toString() === b.toString();
      },
      lessThan: (a, b) => {
        return Number(a) < Number(b);
      },
      lessThanEqualTo: (a, b) => {
        return Number(a) <= Number(b);
      },
      greaterThan: (a, b) => {
        return Number(a) > Number(b);
      },
      greaterThanEqualTo: (a, b) => {
        return Number(a) >= Number(b);
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

    const {
      enableClientSideSearch,
      filters,
      onSearchTextChanged,
      searchText,
    } = props;
    let searchKey;

    /* skipping search when client side search is turned off */
    if (searchText && (!onSearchTextChanged || enableClientSideSearch)) {
      searchKey = searchText.toLowerCase();
    } else {
      searchKey = "";
    }

    const finalTableData = sortedTableData.filter((row) => {
      let isSearchKeyFound = true;

      if (searchKey) {
        isSearchKeyFound = Object.values(row)
          .join(", ")
          .toLowerCase()
          .includes(getSearchKey());
      }

      if (!isSearchKeyFound) {
        return false;
      }

      /* when there is no filter defined */
      if (!filters || filters.length === 0) {
        return true;
      }

      const filterOperator = filters.length >= 2 ? filters[1].operator : "OR";
      let isSatisfyingFilters = filterOperator === "AND";
      for (let i = 0; i < filters.length; i++) {
        let filterResult = true;
        try {
          const conditionFunction = ConditionFunctions[filters[i].condition];
          if (conditionFunction) {
            filterResult = conditionFunction(
              row[filters[i].column],
              filters[i].value,
            );
          }
        } catch (e) {
          filterResult = false;
          console.error(e);
        }

        /* if one filter condition is not satisfied and filter operator is AND, bailout early */
        if (!filterResult && filterOperator === "AND") {
          isSatisfyingFilters = false;
          break;
        } else if (filterResult && filterOperator === "OR") {
          /* if one filter condition is satisfied and filter operator is OR, bailout early */
          isSatisfyingFilters = true;
          break;
        }

        isSatisfyingFilters =
          filterOperator === "AND"
            ? isSatisfyingFilters && filterResult
            : isSatisfyingFilters || filterResult;
      }

      return isSatisfyingFilters;
    });

    return finalTableData;
  },
  //
};
