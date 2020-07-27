export const filterTableData = (
  tableData?: object[],
  filterKeyword?: string,
) => {
  if (!tableData || !tableData.length) {
    return [];
  }

  if (!filterKeyword) {
    return tableData;
  }

  const searchKey = filterKeyword.toString().toUpperCase();
  return tableData.filter((item: object) => {
    return Object.values(item)
      .join(", ")
      .toUpperCase()
      .includes(searchKey);
  });
};
