export default {
  getSelectedRow: (props) => {
    const selectedRowIndex =
      props.selectedRowIndex === undefined ||
      Number.isNaN(parseInt(props.selectedRowIndex))
        ? -1
        : parseInt(props.selectedRowIndex);
    const filteredTableData = props.filteredTableData || props.tableData || [];
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
  getSelectedRows: (props) => {
    const selectedRowIndices = props.selectedRowIndices || [];
    const filteredTableData = props.filteredTableData || props.tableData || [];

    const selectedRows = selectedRowIndices.map(
      (ind) => filteredTableData[ind],
    );
    return selectedRows;
  },
};
