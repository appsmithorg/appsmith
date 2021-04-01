export const getIndextoUpdate = (
  headers: any,
  contentTypeHeaderIndex: number,
) => {
  const firstEmptyHeaderRowIndex: number = headers.findIndex(
    (element: { key: string; value: string }) =>
      element && element.key === "" && element.value === "",
  );
  const newHeaderIndex =
    firstEmptyHeaderRowIndex > -1 ? firstEmptyHeaderRowIndex : headers.length;
  const indexToUpdate =
    contentTypeHeaderIndex > -1 ? contentTypeHeaderIndex : newHeaderIndex;
  return indexToUpdate;
};
