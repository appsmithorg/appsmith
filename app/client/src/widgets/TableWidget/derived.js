export default {
  getSelectedRow: (props) => {
    const selectedRowIndex =
      props.selectedRowIndex === undefined ||
      Number.isNaN(parseInt(props.selectedRowIndex))
        ? -1
        : parseInt(props.selectedRowIndex);
    const filteredTableData =
      props.filteredTableData || props.sanitizedTableData || [];
    if (selectedRowIndex === -1) {
      const emptyRow = { ...filteredTableData[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return emptyRow;
    }
    const selectedRow = { ...filteredTableData[selectedRowIndex] };
    return selectedRow;
  },
  //
  getSelectedRows: (props) => {
    const selectedRowIndices = props.selectedRowIndices || [];
    const filteredTableData =
      props.filteredTableData || props.sanitizedTableData || [];

    const selectedRows = selectedRowIndices.map(
      (ind) => filteredTableData[ind],
    );
    return selectedRows;
  },
  //
  getPageSize: (props) => {
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
  getSanitizedTableData: (props) => {
    const separatorRegex = /\W+/;

    if (props.tableData && Array.isArray(props.tableData)) {
      return props.tableData.map((entry) => {
        const sanitizedData = {};

        for (const [key, value] of Object.entries(entry)) {
          const sanitizedKey = key
            .split(separatorRegex)
            .join("_")
            .slice(0, 200);
          sanitizedData[sanitizedKey] = value;
        }
        return sanitizedData;
      });
    }
    return [];
  },
  //
};
