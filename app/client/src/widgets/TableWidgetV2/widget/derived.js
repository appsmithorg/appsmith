/* eslint-disable @typescript-eslint/no-unused-vars*/
export default {
  getSelectedRow: (props, moment, _) => {
    let index = -1;

    /*
     * If multiRowSelection is turned on, use the last index to
     * populate the selectedRowIndex
     */
    if (props.multiRowSelection) {
      if (
        _.isArray(props.selectedRowIndices) &&
        props.selectedRowIndices.length &&
        props.selectedRowIndices.every((i) => _.isNumber(i))
      ) {
        index = props.selectedRowIndices[props.selectedRowIndices.length - 1];
      } else if (_.isNumber(props.selectedRowIndices)) {
        index = props.selectedRowIndices;
      }
    } else if (
      !_.isNil(props.selectedRowIndex) &&
      !_.isNaN(parseInt(props.selectedRowIndex))
    ) {
      index = parseInt(props.selectedRowIndex);
    }

    const rows = props.filteredTableData || props.processedTableData || [];

    const primaryColumns = props.primaryColumns;
    const nonDataColumnTypes = [
      "editActions",
      "button",
      "iconButton",
      "menuButton",
    ];
    const nonDataColumnAliases = primaryColumns
      ? Object.values(primaryColumns)
          .filter((column) => nonDataColumnTypes.includes(column.columnType))
          .map((column) => column.alias)
      : [];

    let selectedRow;

    /*
     * Note(Balaji): Need to include customColumn values in the selectedRow (select, rating)
     * It should have updated values.
     */
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

    const keysToBeOmitted = [
      "__originalIndex__",
      "__primaryKey__",
      ...nonDataColumnAliases,
    ];

    return _.omit(selectedRow, keysToBeOmitted);
  },
  //
  getTriggeredRow: (props, moment, _) => {
    let index = -1;
    const parsedTriggeredRowIndex = parseInt(props.triggeredRowIndex);

    if (!_.isNaN(parsedTriggeredRowIndex)) {
      index = parsedTriggeredRowIndex;
    }

    const rows = props.filteredTableData || props.processedTableData || [];
    const primaryColumns = props.primaryColumns;
    const nonDataColumnTypes = [
      "editActions",
      "button",
      "iconButton",
      "menuButton",
    ];
    const nonDataColumnAliases = primaryColumns
      ? Object.values(primaryColumns)
          .filter((column) => nonDataColumnTypes.includes(column.columnType))
          .map((column) => column.alias)
      : [];
    let triggeredRow;

    /*
     * Note(Balaji): Need to include customColumn values in the triggeredRow (select, rating)
     * It should have updated values.
     */
    if (index > -1) {
      const row = rows.find((row) => row.__originalIndex__ === index);

      triggeredRow = { ...row };
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

    const keysToBeOmitted = [
      "__originalIndex__",
      "__primaryKey__",
      ...nonDataColumnAliases,
    ];

    return _.omit(triggeredRow, keysToBeOmitted);
  },
  //
  getSelectedRows: (props, moment, _) => {
    if (!props.multiRowSelection) {
      return [];
    }

    let indices = [];

    if (
      _.isArray(props.selectedRowIndices) &&
      props.selectedRowIndices.every((i) => _.isNumber(i))
    ) {
      indices = props.selectedRowIndices;
    }

    const rows = props.filteredTableData || props.processedTableData || [];
    const primaryColumns = props.primaryColumns;
    const nonDataColumnTypes = [
      "editActions",
      "button",
      "iconButton",
      "menuButton",
    ];
    const nonDataColumnAliases = primaryColumns
      ? Object.values(primaryColumns)
          .filter((column) => nonDataColumnTypes.includes(column.columnType))
          .map((column) => column.alias)
      : [];
    const keysToBeOmitted = [
      "__originalIndex__",
      "__primaryKey__",
      ...nonDataColumnAliases,
    ];

    return indices.map((index) => _.omit(rows[index], keysToBeOmitted));
  },
  //
  getPageSize: (props, moment, _) => {
    const TABLE_SIZES = {
      DEFAULT: {
        COLUMN_HEADER_HEIGHT: 32,
        TABLE_HEADER_HEIGHT: 38,
        ROW_HEIGHT: 40,
        ROW_FONT_SIZE: 14,
        VERTICAL_PADDING: 6,
        EDIT_ICON_TOP: 10,
      },
      SHORT: {
        COLUMN_HEADER_HEIGHT: 32,
        TABLE_HEADER_HEIGHT: 38,
        ROW_HEIGHT: 30,
        ROW_FONT_SIZE: 12,
        VERTICAL_PADDING: 0,
        EDIT_ICON_TOP: 5,
      },
      TALL: {
        COLUMN_HEADER_HEIGHT: 32,
        TABLE_HEADER_HEIGHT: 38,
        ROW_HEIGHT: 60,
        ROW_FONT_SIZE: 18,
        VERTICAL_PADDING: 16,
        EDIT_ICON_TOP: 21,
      },
    };
    const compactMode = props.compactMode || "DEFAULT";
    const componentHeight = props.componentHeight - 10;
    const tableSizes = TABLE_SIZES[compactMode];

    let pageSize =
      (componentHeight -
        tableSizes.TABLE_HEADER_HEIGHT -
        tableSizes.COLUMN_HEADER_HEIGHT) /
      tableSizes.ROW_HEIGHT;

    return pageSize % 1 > 0.3 && props.tableData.length > pageSize
      ? Math.ceil(pageSize)
      : Math.floor(pageSize);
  },
  //
  getProcessedTableData: (props, moment, _) => {
    let data;

    if (_.isArray(props.tableData)) {
      /* Populate meta keys (__originalIndex__, __primaryKey__) and transient values */
      data = props.tableData.map((row, index) => ({
        ...row,
        __originalIndex__: index,
        __primaryKey__: props.primaryColumnId
          ? row[props.primaryColumnId]
          : undefined,
        ...props.transientTableData[index],
      }));
    } else {
      data = [];
    }

    return data;
  },
  //
  getOrderedTableColumns: (props, moment, _) => {
    let columns = [];
    let existingColumns = props.primaryColumns || {};

    /*
     * Assign index based on the columnOrder
     */
    if (
      _.isArray(props.columnOrder) &&
      props.columnOrder.length > 0 &&
      Object.keys(existingColumns).length > 0
    ) {
      const newColumnsInOrder = {};
      let index = 0;

      _.uniq(props.columnOrder).forEach((columnId) => {
        if (existingColumns[columnId]) {
          newColumnsInOrder[columnId] = Object.assign(
            {},
            existingColumns[columnId],
            {
              index,
            },
          );

          index++;
        }
      });

      existingColumns = newColumnsInOrder;
    }

    const sortByColumn = props.sortOrder && props.sortOrder.column;
    const isAscOrder = props.sortOrder && props.sortOrder.order === "asc";

    /* set sorting flags and convert the existing columns into an array */
    Object.values(existingColumns).forEach((column) => {
      /* guard to not allow columns without id */
      if (column.id) {
        columns.push({
          ...column,
          isAscOrder: column.id === sortByColumn ? isAscOrder : undefined,
        });
      }
    });

    return columns;
  },
  //
  getFilteredTableData: (props, moment, _) => {
    /* Make a shallow copy */
    const primaryColumns = props.primaryColumns || {};
    let processedTableData = [...props.processedTableData];
    const derivedColumns = {};

    Object.keys(primaryColumns).forEach((id) => {
      if (primaryColumns[id] && primaryColumns[id].isDerived) {
        derivedColumns[id] = primaryColumns[id];
      }
    });

    if (!processedTableData || !processedTableData.length) {
      return [];
    }

    /* extend processedTableData with values from
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
              /* do nothing */
            }
          } else if (_.isArray(column.computedValue)) {
            computedValues = column.computedValue;
          }
        }

        /* for derived columns inject empty strings */
        if (
          computedValues.length === 0 &&
          derivedColumns &&
          derivedColumns[id]
        ) {
          computedValues = Array(processedTableData.length).fill("");
        }

        computedValues.forEach((computedValue, index) => {
          processedTableData[index] = {
            ...processedTableData[index],
            [column.alias]: computedValue,
          };
        });
      });
    }

    const columns = props.orderedTableColumns;
    const sortByColumnId = props.sortOrder.column;

    let sortedTableData;
    /* 
    Check if there are select columns, 
    and if the columns are sorting by label instead of default value 
    */
    const selectColumnKeysWithSortByLabel = [];

    Object.entries(primaryColumns).forEach(([id, column]) => {
      const isColumnSortedByLabel =
        column?.columnType === "select" &&
        column?.sortBy === "label" &&
        column?.selectOptions?.length;

      if (isColumnSortedByLabel) {
        selectColumnKeysWithSortByLabel.push(id);
      }
    });

    /* 
    If there are select columns, 
    transform the specific columns data to show the label instead of the value for sorting 
    */
    let processedTableDataWithLabelInsteadOfValue;

    if (selectColumnKeysWithSortByLabel.length) {
      const transformedValueToLabelTableData = processedTableData.map((row) => {
        const newRow = { ...row };

        selectColumnKeysWithSortByLabel.forEach((key) => {
          const value = row[key];
          const isSelectOptionsAnArray = _.isArray(
            primaryColumns[key].selectOptions,
          );

          let selectOptions;

          /*
           * If selectOptions is an array, check if it contains nested arrays.
           * This is to handle situations where selectOptons is a javascript object and computes as a nested array.
           */
          if (isSelectOptionsAnArray) {
            if (_.some(primaryColumns[key].selectOptions, _.isArray)) {
              /* Handle the case where selectOptions contains nested arrays - selectOptions is javascript */
              selectOptions =
                primaryColumns[key].selectOptions[row.__originalIndex__];
              const option = selectOptions.find((option) => {
                return option.value === value;
              });

              if (option) {
                newRow[key] = option.label;
              }
            } else {
              /* Handle the case where selectOptions is a flat array - selectOptions is plain JSON */
              selectOptions = primaryColumns[key].selectOptions;
              const option = selectOptions.find(
                (option) => option.value === value,
              );

              if (option) {
                newRow[key] = option.label;
              }
            }
          } else {
            /* If selectOptions is not an array, parse it as JSON - not evaluated yet, so returns as string */
            selectOptions = JSON.parse(primaryColumns[key].selectOptions);
            const option = selectOptions.find(
              (option) => option.value === value,
            );

            if (option) {
              newRow[key] = option.label;
            }
          }
        });

        return newRow;
      });

      processedTableDataWithLabelInsteadOfValue =
        transformedValueToLabelTableData;
    }

    if (sortByColumnId) {
      const sortBycolumn = columns.find(
        (column) => column.id === sortByColumnId,
      );
      const sortByColumnOriginalId = sortBycolumn.alias;

      const columnType =
        sortBycolumn && sortBycolumn.columnType
          ? sortBycolumn.columnType
          : "text";

      let inputFormat = (() => {
        switch (sortBycolumn.inputFormat) {
          case "Epoch":
            return "X";
          case "Milliseconds":
            return "x";
          default:
            return sortBycolumn.inputFormat;
        }
      })();

      const isEmptyOrNil = (value) => {
        return _.isNil(value) || value === "";
      };
      const isAscOrder = props.sortOrder.order === "asc";
      const sortByOrder = (isAGreaterThanB) => {
        if (isAGreaterThanB) {
          return isAscOrder ? 1 : -1;
        } else {
          return isAscOrder ? -1 : 1;
        }
      };

      const transformedTableDataForSorting =
        selectColumnKeysWithSortByLabel.length
          ? processedTableDataWithLabelInsteadOfValue
          : processedTableData;

      sortedTableData = transformedTableDataForSorting.sort((a, b) => {
        if (_.isPlainObject(a) && _.isPlainObject(b)) {
          if (
            isEmptyOrNil(a[sortByColumnOriginalId]) ||
            isEmptyOrNil(b[sortByColumnOriginalId])
          ) {
            /* push null, undefined and "" values to the bottom. */
            return isEmptyOrNil(a[sortByColumnOriginalId]) ? 1 : -1;
          } else {
            switch (columnType) {
              case "number":
              case "currency":
                return sortByOrder(
                  Number(a[sortByColumnOriginalId]) >
                    Number(b[sortByColumnOriginalId]),
                );
              case "date":
                try {
                  return sortByOrder(
                    moment(a[sortByColumnOriginalId], inputFormat).isAfter(
                      moment(b[sortByColumnOriginalId], inputFormat),
                    ),
                  );
                } catch (e) {
                  return -1;
                }
              case "url":
                const column = primaryColumns[sortByColumnOriginalId];

                if (column && column.displayText) {
                  if (_.isString(column.displayText)) {
                    return sortByOrder(false);
                  } else if (_.isArray(column.displayText)) {
                    return sortByOrder(
                      column.displayText[a.__originalIndex__]
                        .toString()
                        .toLowerCase() >
                        column.displayText[b.__originalIndex__]
                          .toString()
                          .toLowerCase(),
                    );
                  }
                }
              default:
                return sortByOrder(
                  a[sortByColumnOriginalId].toString().toLowerCase() >
                    b[sortByColumnOriginalId].toString().toLowerCase(),
                );
            }
          }
        } else {
          return isAscOrder ? 1 : 0;
        }
      });

      /*
       * When sorting is done, transform the data back to its original state
       * where table data shows value instead of label
       */
      if (selectColumnKeysWithSortByLabel.length) {
        const transformedLabelToValueData = sortedTableData.map((row) => {
          const newRow = { ...row };

          selectColumnKeysWithSortByLabel.forEach((key) => {
            const label = row[key];
            const isSelectOptionsAnArray = _.isArray(
              primaryColumns[key].selectOptions,
            );

            let selectOptions;

            /*
             * If selectOptions is an array, check if it contains nested arrays.
             * This is to handle situations where selectOptons is a javascript object and computes as a nested array.
             */
            if (isSelectOptionsAnArray) {
              if (_.some(primaryColumns[key].selectOptions, _.isArray)) {
                /* Handle the case where selectOptions contains nested arrays - selectOptions is javascript */
                selectOptions =
                  primaryColumns[key].selectOptions[row.__originalIndex__];
                const option = selectOptions.find((option) => {
                  return option.label === label;
                });

                if (option) {
                  newRow[key] = option.value;
                }
              } else {
                /* Handle the case where selectOptions is a flat array - selectOptions is plain JSON */
                selectOptions = primaryColumns[key].selectOptions;
                const option = selectOptions.find(
                  (option) => option.label === label,
                );

                if (option) {
                  newRow[key] = option.value;
                }
              }
            } else {
              /* If selectOptions is not an array, parse it as JSON - not evaluated yet, so returns as string */
              selectOptions = JSON.parse(primaryColumns[key].selectOptions);
              const option = selectOptions.find(
                (option) => option.label === label,
              );

              if (option) {
                newRow[key] = option.value;
              }
            }
          });

          return newRow;
        });

        sortedTableData = transformedLabelToValueData;
      }
    } else {
      sortedTableData = [...processedTableData];
    }

    const ConditionFunctions = {
      isExactly: (a, b) => {
        return a.toString() === b.toString();
      },
      empty: (a) => {
        return _.isNil(a) || _.isEmpty(a.toString());
      },
      notEmpty: (a) => {
        return !_.isNil(a) && !_.isEmpty(a.toString());
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
            a.toString().toLowerCase().indexOf(b.toString().toLowerCase()) === 0
          );
        } catch (e) {
          return false;
        }
      },
      endsWith: (a, b) => {
        try {
          const _a = a.toString().toLowerCase();
          const _b = b.toString().toLowerCase();

          return (
            _a.lastIndexOf(_b) >= 0 &&
            _a.length === _a.lastIndexOf(_b) + _b.length
          );
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
      isChecked: (a) => {
        return a === true;
      },
      isUnChecked: (a) => {
        return a === false;
      },
    };
    let searchKey;

    /* skipping search when client side search is turned off */
    if (
      props.searchText &&
      (!props.onSearchTextChanged || props.enableClientSideSearch)
    ) {
      searchKey = props.searchText.toLowerCase();
    } else {
      searchKey = "";
    }

    /*
     * We need to omit hidden column values from being included
     * in the search
     */
    const hiddenColumns = Object.values(props.primaryColumns)
      .filter((column) => !column.isVisible)
      .map((column) => column.alias);

    const finalTableData = sortedTableData.filter((row) => {
      let isSearchKeyFound = true;
      const columnWithDisplayText = Object.values(props.primaryColumns).filter(
        (column) => column.columnType === "url" && column.displayText,
      );

      /*
       * For select columns with label and values, we need to include the label value
       * in the search and filter data
       */
      let labelValuesForSelectCell = {};
      /*
       * Initialize an array to store keys for columns that have the 'select' column type
       * and contain selectOptions.
       */
      const selectColumnKeys = [];

      /*
       * Iterate over the primary columns to identify which columns are of type 'select'
       * and have selectOptions. These keys are pushed into the selectColumnKeys array.
       */
      Object.entries(props.primaryColumns).forEach(([id, column]) => {
        const isColumnSelectColumnType =
          column?.columnType === "select" && column?.selectOptions?.length;

        if (isColumnSelectColumnType) {
          selectColumnKeys.push(id);
        }
      });

      /*
       * If there are any select columns, iterate over them to find the label value
       * associated with the selected value in each row.
       */
      if (selectColumnKeys.length) {
        selectColumnKeys.forEach((key) => {
          const value = row[key];

          const isSelectOptionsAnArray = _.isArray(
            primaryColumns[key].selectOptions,
          );

          let selectOptions = {};

          /*
           * If selectOptions is an array, check if it contains nested arrays.
           * This is to handle situations where selectOptons is a javascript object and computes as a nested array.
           */
          if (isSelectOptionsAnArray) {
            const selectOptionKey = primaryColumns[key].alias;

            if (_.some(primaryColumns[key].selectOptions, _.isArray)) {
              /* Handle the case where selectOptions contains nested arrays - selectOptions is javascript */
              selectOptions =
                primaryColumns[key].selectOptions[row.__originalIndex__];
              const option = selectOptions.find((option) => {
                return option.value === value;
              });

              if (option) {
                labelValuesForSelectCell[selectOptionKey] = option.label;
              }
            } else {
              /* Handle the case where selectOptions is a flat array - selectOptions is plain JSON */
              selectOptions = primaryColumns[key].selectOptions;
              const option = selectOptions.find(
                (option) => option.value === value,
              );

              if (option) {
                labelValuesForSelectCell[selectOptionKey] = option.label;
              }
            }
          } else {
            /* If selectOptions is not an array, parse it as JSON - not evaluated yet, so returns as string */
            selectOptions = JSON.parse(primaryColumns[key].selectOptions);
            const option = selectOptions.find(
              (option) => option.value === value,
            );

            if (option) {
              labelValuesForSelectCell[selectOptionKey] = option.label;
            }
          }
        });
      }

      const displayedRow = {
        ...row,
        ...labelValuesForSelectCell,
        ...columnWithDisplayText.reduce((acc, column) => {
          let displayText;

          if (_.isArray(column.displayText)) {
            displayText = column.displayText[row.__originalIndex__];
          } else {
            displayText = column.displayText;
          }

          acc[column.alias] = displayText;

          return acc;
        }, {}),
      };

      if (searchKey) {
        isSearchKeyFound = Object.values(_.omit(displayedRow, hiddenColumns))
          .join(", ")
          .toLowerCase()
          .includes(searchKey);
      }

      if (!isSearchKeyFound) {
        return false;
      }

      /* when there is no filter defined or when server side filtering is enabled prevent client-side filtering  */
      if (
        !props.filters ||
        props.filters.length === 0 ||
        props.enableServerSideFiltering
      ) {
        return true;
      }

      const filterOperator =
        props.filters.length >= 2 ? props.filters[1].operator : "OR";
      let isSatisfyingFilters = filterOperator === "AND";

      for (let i = 0; i < props.filters.length; i++) {
        let filterResult = true;

        try {
          const conditionFunction =
            ConditionFunctions[props.filters[i].condition];

          if (conditionFunction) {
            const originalRow = props.tableData[row.__originalIndex__];
            filterResult = conditionFunction(
              originalRow[props.filters[i].column],
              props.filters[i].value,
            ) || conditionFunction(
              displayedRow[props.filters[i].column],
              props.filters[i].value,
            );
          }
        } catch (e) {
          filterResult = false;
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
  getUpdatedRow: (props, moment, _) => {
    let index = -1;
    const parsedUpdatedRowIndex = parseInt(props.updatedRowIndex);

    if (!_.isNaN(parsedUpdatedRowIndex)) {
      index = parsedUpdatedRowIndex;
    }

    const rows = props.filteredTableData || props.processedTableData || [];
    const primaryColumns = props.primaryColumns;
    let updatedRow;

    if (index > -1) {
      const row = rows.find((row) => row.__originalIndex__ === index);

      updatedRow = { ...row };
    } else {
      /*
       *  If updatedRowIndex is not a valid index, updatedRow should
       *  have proper row structure with empty string values
       */
      updatedRow = {};

      if (rows && rows[0]) {
        Object.keys(rows[0]).forEach((key) => {
          updatedRow[key] = "";
        });
      }
    }

    const nonDataColumnTypes = [
      "editActions",
      "button",
      "iconButton",
      "menuButton",
    ];
    const nonDataColumnAliases = primaryColumns
      ? Object.values(primaryColumns)
          .filter((column) => nonDataColumnTypes.includes(column.columnType))
          .map((column) => column.alias)
      : [];

    const keysToBeOmitted = [
      "__originalIndex__",
      "__primaryKey__",
      ...nonDataColumnAliases,
    ];

    return _.omit(updatedRow, keysToBeOmitted);
  },
  //
  getUpdatedRows: (props, moment, _) => {
    const primaryColumns = props.primaryColumns;
    const nonDataColumnTypes = [
      "editActions",
      "button",
      "iconButton",
      "menuButton",
    ];
    const nonDataColumnAliases = primaryColumns
      ? Object.values(primaryColumns)
          .filter((column) => nonDataColumnTypes.includes(column.columnType))
          .map((column) => column.alias)
      : [];
    const keysToBeOmitted = [
      "__originalIndex__",
      "__primaryKey__",
      ...nonDataColumnAliases,
    ];
    /*
     * case 1. If transientTableData is not empty, return aray of updated row.
     * case 2. If transientTableData is empty, return empty array
     *
     * updated row structure
     *  {
     *    index: {{original index of the row}},
     *    {{primary_column}}: {{primary_column_value}} // only if primary has been set
     *    updatedFields: {
     *      {{updated_column_1}}: {{updated_column_1_value}}
     *    },
     *    allFields: {
     *      {{updated_column_1}}: {{updated_column_1_value}}
     *      {{rest of the fields from the row}}
     *    }
     *  }
     */

    /* case 1 */
    if (
      props.transientTableData &&
      !!Object.keys(props.transientTableData).length
    ) {
      const updatedRows = [];
      const tableData = props.processedTableData || props.tableData;

      /* updatedRows is not sorted by index */
      Object.entries(props.transientTableData)
        .filter((entry) => {
          return (
            !_.isNil(entry[0]) && !!entry[0] && _.isFinite(Number(entry[0]))
          );
        })
        .forEach((entry) => {
          const key = entry[0];
          const value = entry[1];
          const row = tableData.find(
            (row) => row.__originalIndex__ === Number(key),
          );

          updatedRows.push({
            index: Number(key),
            [props.primaryColumnId]: row[props.primaryColumnId],
            updatedFields: value,
            allFields: _.omit(row, keysToBeOmitted) || {},
          });
        });

      return updatedRows;
    } else {
      /* case 2 */
      return [];
    }
  },
  //
  getUpdatedRowIndices: (props, moment, _) => {
    /* should return the keys of the transientTableData */
    if (props.transientTableData) {
      return Object.keys(props.transientTableData).map((index) =>
        Number(index),
      );
    } else {
      return [];
    }
  },
  //
  getPageOffset: (props, moment, _) => {
    const pageSize =
      props.serverSidePaginationEnabled && props.tableData
        ? props.tableData?.length
        : props.pageSize;

    if (
      Number.isFinite(props.pageNo) &&
      Number.isFinite(pageSize) &&
      props.pageNo >= 0 &&
      pageSize >= 0
    ) {
      /* Math.max fixes the value of (pageNo - 1) to a minimum of 0 as negative values are not valid */
      return Math.max(props.pageNo - 1, 0) * pageSize;
    }

    return 0;
  },
  //
  getEditableCellValidity: (props, moment, _) => {
    if (
      (!props.editableCell?.column && !props.isAddRowInProgress) ||
      !props.primaryColumns
    ) {
      return {};
    }

    const createRegex = (regex) => {
      if (!regex) {
        return new RegExp("//");
      }

      /*
       * break up the regexp pattern into 4 parts: given regex, regex prefix , regex pattern, regex flags
       * Example /test/i will be split into ["/test/gi", "/", "test", "gi"]
       */
      const regexParts = regex.match(/(\/?)(.+)\\1([a-z]*)/i);
      let parsedRegex;

      if (!regexParts) {
        parsedRegex = new RegExp(regex);
      } else {
        /*
         * if we don't have a regex flags (gmisuy), convert provided string into regexp directly
         */
        if (
          regexParts[3] &&
          !/^(?!.*?(.).*?\\1)[gmisuy]+$/.test(regexParts[3])
        ) {
          parsedRegex = RegExp(regex);
        } else {
          /*
           * if we have a regex flags, use it to form regexp
           */
          parsedRegex = new RegExp(regexParts[2], regexParts[3]);
        }
      }

      return parsedRegex;
    };

    let editableColumns = [];
    const validatableColumns = ["text", "number", "currency", "date", "select"];

    if (props.isAddRowInProgress) {
      Object.values(props.primaryColumns)
        .filter(
          (column) =>
            column.isEditable && validatableColumns.includes(column.columnType),
        )
        .forEach((column) => {
          editableColumns.push([column, props.newRow[column.alias]]);
        });
    } else {
      const editedColumn = Object.values(props.primaryColumns).find(
        (column) => column.alias === props.editableCell?.column,
      );

      if (validatableColumns.includes(editedColumn.columnType)) {
        editableColumns.push([editedColumn, props.editableCell?.value]);
      }
    }

    const validationMap = {};

    editableColumns.forEach((validationObj) => {
      const editedColumn = validationObj[0];
      const value = validationObj[1];

      if (editedColumn && editedColumn.validation) {
        const validation = editedColumn.validation;

        /* General validations */
        if (
          !validation.isColumnEditableCellRequired &&
          (value === "" || _.isNil(value))
        ) {
          validationMap[editedColumn.alias] = true;

          return;
        } else if (
          (!_.isNil(validation.isColumnEditableCellValid) &&
            !validation.isColumnEditableCellValid) ||
          (validation.regex && !createRegex(validation.regex).test(value)) ||
          (validation.isColumnEditableCellRequired &&
            (value === "" || _.isNil(value)))
        ) {
          validationMap[editedColumn.alias] = false;

          return;
        }

        /* Column type related validations */
        switch (editedColumn.columnType) {
          case "number":
          case "currency":
            if (
              !_.isNil(validation.min) &&
              validation.min !== "" &&
              validation.min > value
            ) {
              validationMap[editedColumn.alias] = false;

              return;
            }

            if (
              !_.isNil(validation.max) &&
              validation.max !== "" &&
              validation.max < value
            ) {
              validationMap[editedColumn.alias] = false;

              return;
            }

            break;
        }
      }

      validationMap[editedColumn.alias] = true;
    });

    return validationMap;
  },
  //
  getTableHeaders: (props, moment, _) => {
    const columns = props.primaryColumns
      ? Object.values(props.primaryColumns)
      : [];

    return columns
      .sort((a, b) => a.index - b.index)
      .map((column) => ({
        id: column?.id,
        label: column?.label,
        isVisible: column?.isVisible,
      }));
  },
  //
};
