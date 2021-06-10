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
