import log from "loglevel";
import _, { isNumber, isNil, isArray } from "lodash";
import { format, parse, isValid } from "date-fns";
import type { EditableCell } from "../../constants";
import { ColumnTypes, DateInputFormat } from "../../constants";
import type { ReactTableColumnProps } from "../../component/Constants";
import memoizeOne from "memoize-one";
import shallowEqual from "shallowequal";

export type tableData = Array<Record<string, unknown>>;

//TODO: (Vamsi) need to unit test this function
export const transformDataPureFn = (
  tableData: Array<Record<string, unknown>>,
  columns: ReactTableColumnProps[],
): tableData => {
  if (isArray(tableData)) {
    return tableData.map((row, rowIndex) => {
      // TODO: Fix this the next time the file is edited
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newRow: { [key: string]: any } = {};

      columns.forEach((column) => {
        const { alias } = column;
        let value = row[alias];

        if (column.metaProperties) {
          switch (column.metaProperties.type) {
            case ColumnTypes.DATE:
              let isValidDate = true;
              const outputFormat = _.isArray(column.metaProperties.format)
                ? column.metaProperties.format[rowIndex]
                : column.metaProperties.format;
              let inputFormat;

              try {
                const type = _.isArray(column.metaProperties.inputFormat)
                  ? column.metaProperties.inputFormat[rowIndex]
                  : column.metaProperties.inputFormat;

                if (
                  type !== DateInputFormat.EPOCH &&
                  type !== DateInputFormat.MILLISECONDS
                ) {
                  inputFormat = type;
                  parse(value as string, inputFormat, new Date());
                } else if (!isNumber(value)) {
                  isValidDate = false;
                }
              } catch (e) {
                isValidDate = false;
              }

              if (isValidDate && value) {
                try {
                  if (
                    column.metaProperties.inputFormat ===
                    DateInputFormat.MILLISECONDS
                  ) {
                    value = Number(value);
                  } else if (
                    column.metaProperties.inputFormat === DateInputFormat.EPOCH
                  ) {
                    value = 1000 * Number(value);
                  }

                  const parsedDate = inputFormat 
                    ? parse(value as string, inputFormat, new Date())
                    : new Date(value as number);
                  newRow[alias] = format(parsedDate, outputFormat);
                } catch (e) {
                  log.debug("Unable to parse Date:", { e });
                  newRow[alias] = "";
                }
              } else if (value) {
                newRow[alias] = "Invalid Value";
              } else {
                newRow[alias] = "";
              }

              break;
            default:
              let data;

              if (
                _.isString(value) ||
                _.isNumber(value) ||
                _.isBoolean(value)
              ) {
                data = value;
              } else if (isNil(value)) {
                data = "";
              } else {
                data = JSON.stringify(value);
              }

              newRow[alias] = data;
              break;
          }
        }
      });

      return newRow;
    });
  } else {
    return [];
  }
};

// lazily generate the cache so that we can create several memoised instances
const getMemoizedTransformData = () => memoizeOne(transformDataPureFn);

export const injectEditableCellToTableData = (
  tableData: tableData,
  editableCell: EditableCell | undefined,
): tableData => {
  /*
   * Inject the edited cell value from the editableCell object
   */
  if (!editableCell || !tableData.length) return tableData;

  const { column, index: updatedRowIndex, inputValue } = editableCell;

  const inRangeForUpdate =
    updatedRowIndex >= 0 && updatedRowIndex < tableData.length;

  if (!inRangeForUpdate) return tableData;

  //if same value ignore update
  if (tableData[updatedRowIndex][column] === inputValue) return tableData;

  //create copies of data
  const copy = [...tableData];

  copy[updatedRowIndex] = { ...copy[updatedRowIndex], [column]: inputValue };

  return copy;
};

const getMemoiseInjectEditableCellToTableData = () =>
  memoizeOne(injectEditableCellToTableData, (prev, next) => {
    const [prevTableData, prevCellEditable] = prev;
    const [nextTableData, nextCellEditable] = next;

    //shallow compare the cellEditable properties
    if (!shallowEqual(prevCellEditable, nextCellEditable)) return false;

    return shallowEqual(prevTableData, nextTableData);
  });

export type transformDataWithEditableCell = (
  editableCell: EditableCell | undefined,
  tableData: Array<Record<string, unknown>>,
  columns: ReactTableColumnProps[],
) => tableData;

// the result of this cache function is a prop for the useTable hook, this prop needs to memoised as per their docs
// we have noticed expensive computation from the useTable if tableData isnt memoised
export const getMemoiseTransformDataWithEditableCell =
  (): transformDataWithEditableCell => {
    const memoizedTransformData = getMemoizedTransformData();
    const memoiseInjectEditableCellToTableData =
      getMemoiseInjectEditableCellToTableData();

    return memoizeOne((editableCell, tableData, columns) => {
      const transformedData = memoizedTransformData(tableData, columns);

      return memoiseInjectEditableCellToTableData(
        transformedData,
        editableCell,
      );
    });
  };
