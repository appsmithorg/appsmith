/**
 * This function updates the header at a given index.
 * If headerIndexToUpdate is -1, i.e the header we are looking for is not present, then
 * update the header key-value pair in the first non-empty row
 * @param headers
 * @param headerIndexToUpdate
 * @returns
 */
export const getIndextoUpdate = (headers: any, headerIndexToUpdate: number) => {
  const firstEmptyHeaderRowIndex: number = headers.findIndex(
    (element: { key: string; value: string }) =>
      element && element.key === "" && element.value === "",
  );
  const newHeaderIndex =
    firstEmptyHeaderRowIndex > -1 ? firstEmptyHeaderRowIndex : headers.length;
  const indexToUpdate =
    headerIndexToUpdate > -1 ? headerIndexToUpdate : newHeaderIndex;
  return indexToUpdate;
};

export const queryParamsRegEx = /([\s\S]*?)(\?(?![^{]*})[\s\S]*)?$/;

export function parseUrlForQueryParams(url: string) {
  const padQueryParams = { key: "", value: "" };
  let params = Array(2).fill(padQueryParams);
  const matchGroup = url.match(queryParamsRegEx) || [];
  const parsedUrlWithQueryParams = matchGroup[2] || "";
  if (parsedUrlWithQueryParams.indexOf("?") > -1) {
    const paramsString = parsedUrlWithQueryParams.substr(
      parsedUrlWithQueryParams.indexOf("?") + 1,
    );
    params = paramsString.split("&").map((p) => {
      const firstEqualPos = p.indexOf("=");
      const keyValue =
        firstEqualPos > -1
          ? [p.substring(0, firstEqualPos), p.substring(firstEqualPos + 1)]
          : [];
      return { key: keyValue[0] || "", value: keyValue[1] || "" };
    });
  }
  return params;
}
