export default {
  getSelectedRows: (props) => {
    const selectedRowIndex =
      props.selectedRowIndex === undefined ||
      Number.isNaN(parseInt(props.selectedRowIndex))
        ? -1
        : parseInt(props.selectedRowIndex);
    const filteredTableData = props.filteredTableData || [];
    if (selectedRowIndex === -1) {
      const emptyRow = { ...filteredTableData[0] };
      Object.keys(emptyRow).forEach((key) => {
        emptyRow[key] = "";
      });
      return emptyRow;
    }
    return { ...filteredTableData[selectedRowIndex] };
  },
  getSelectedRow: (props) => {
    const selectedRowIndices = props.selectedRowIndices || [];
    const filteredTableData = props.filteredTableData || [];
    return selectedRowIndices.map((ind) => filteredTableData[ind]);
  },
};
