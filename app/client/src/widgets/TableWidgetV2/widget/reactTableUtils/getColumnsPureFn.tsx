import { isBoolean, isArray, findIndex, isEqual } from "lodash";
import type { RenderMode } from "constants/WidgetConstants";
import { RenderModes } from "constants/WidgetConstants";
import { StickyType } from "../../component/Constants";
import {
  COLUMN_MIN_WIDTH,
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_COLUMN_NAME,
} from "../../constants";
import type { ReactTableColumnProps } from "../../component/Constants";
import memoizeOne from "memoize-one";

export type getColumns = (
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderCell: any,
  columnWidthMap: { [key: string]: number } | undefined,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderedTableColumns: any,
  componentWidth: number,
  renderMode: RenderMode,
  isPreviewMode: boolean,
) => ReactTableColumnProps[];

//TODO: (Vamsi) need to unit test this function

export const getColumnsPureFn: getColumns = (
  renderCell,
  columnWidthMap = {},
  orderedTableColumns = [],
  componentWidth,
  renderMode,
  isPreviewMode,
) => {
  let columns: ReactTableColumnProps[] = [];
  const hiddenColumns: ReactTableColumnProps[] = [];

  let totalColumnWidth = 0;

  if (isArray(orderedTableColumns)) {
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderedTableColumns.forEach((column: any) => {
      const isHidden = !column.isVisible;

      const columnData = {
        id: column.id,
        Header:
          column.hasOwnProperty("label") && typeof column.label === "string"
            ? column.label
            : DEFAULT_COLUMN_NAME,
        alias: column.alias,
        // TODO: Fix this the next time the file is edited
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        accessor: (row: any) => row[column.alias],
        width: columnWidthMap[column.id] || DEFAULT_COLUMN_WIDTH,
        minWidth: COLUMN_MIN_WIDTH,
        draggable: true,
        isHidden: false,
        isAscOrder: column.isAscOrder,
        isDerived: column.isDerived,
        sticky: column.sticky,
        metaProperties: {
          isHidden: isHidden,
          type: column.columnType,
          format: column.outputFormat || "",
          inputFormat: column.inputFormat || "",
          decimals: column.decimals || 0,
        },
        columnProperties: column,
        Cell: renderCell,
      };

      const isAllCellVisible: boolean | boolean[] = column.isCellVisible;

      /*
       * If all cells are not visible or column itself is not visible,
       * set isHidden and push it to hiddenColumns array else columns array
       */
      if (
        (isBoolean(isAllCellVisible) && !isAllCellVisible) ||
        (isArray(isAllCellVisible) &&
          isAllCellVisible.every((visibility) => visibility === false)) ||
        isHidden
      ) {
        columnData.isHidden = true;
        hiddenColumns.push(columnData);
      } else {
        totalColumnWidth += columnData.width;
        columns.push(columnData);
      }
    });
  }

  const lastColumnIndex = columns.length - 1;

  if (totalColumnWidth < componentWidth) {
    /*
      This "if" block is responsible for upsizing the last column width
      if there is space left in the table container towards the right
    */
    if (columns[lastColumnIndex]) {
      const lastColumnWidth =
        columns[lastColumnIndex].width || DEFAULT_COLUMN_WIDTH;
      const remainingWidth = componentWidth - totalColumnWidth;

      // Adding the remaining width i.e. space left towards the right, to the last column width
      columns[lastColumnIndex].width = lastColumnWidth + remainingWidth;
    }
  } else if (totalColumnWidth > componentWidth) {
    /*
      This "else-if" block is responsible for downsizing the last column width
      if the last column spills over resulting in horizontal scroll
    */
    const extraWidth = totalColumnWidth - componentWidth;

    if (columns[lastColumnIndex]) {
      const lastColWidth =
        columns[lastColumnIndex].width || DEFAULT_COLUMN_WIDTH;

      /*
      Below if condition explanation:
      Condition 1: (lastColWidth > COLUMN_MIN_WIDTH)
        We will downsize the last column only if its greater than COLUMN_MIN_WIDTH
      Condition 2: (extraWidth < lastColWidth)
        This condition checks whether the last column is the only column that is spilling over.
        If more than one columns are spilling over we won't downsize the last column
    */
      if (lastColWidth > COLUMN_MIN_WIDTH && extraWidth < lastColWidth) {
        const availableWidthForLastColumn = lastColWidth - extraWidth;

        /*
        Below we are making sure last column width doesn't go lower than COLUMN_MIN_WIDTH again
        as availableWidthForLastColumn might go lower than COLUMN_MIN_WIDTH in some cases
      */
        columns[lastColumnIndex].width =
          availableWidthForLastColumn < COLUMN_MIN_WIDTH
            ? COLUMN_MIN_WIDTH
            : availableWidthForLastColumn;
      }
    }
  }

  /*
   * In canvas render mode, hidden columns are rendered at the end of the table, so users can
   * edit the hidden columns without having to make them visible first.
   */
  if (
    hiddenColumns.length &&
    renderMode === RenderModes.CANVAS &&
    !isPreviewMode
  ) {
    // Get the index of the first column that is frozen to right
    const rightFrozenColumnIdx = findIndex(
      columns,
      (col) => col.sticky === StickyType.RIGHT,
    );

    if (rightFrozenColumnIdx !== -1) {
      columns.splice(rightFrozenColumnIdx, 0, ...hiddenColumns);
    } else {
      columns = columns.concat(hiddenColumns);
    }
  }

  return columns.filter((column: ReactTableColumnProps) => !!column.id);
};

// the result of this cache function is a prop for the useTable hook, this prop needs to memoised as per their docs
// we have noticed expensive computation from the useTable if columns isnt memoised
export const getMemoiseGetColumnsWithLocalStorageFn = () => {
  const memoisedGetColumns = memoizeOne(getColumnsPureFn);

  return memoizeOne(
    //we are not using this parameter it is used by the memoisation comparator
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (widgetLocalStorageState) => {
      memoisedGetColumns.clear();

      return memoisedGetColumns as getColumns;
    },
    isEqual,
  );
};
