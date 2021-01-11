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
};
