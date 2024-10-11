import { CONTENT_TYPE_HEADER_KEY } from "constants/ApiEditorConstants/CommonApiConstants";
import {
  getDynamicStringSegments,
  isDynamicValue,
} from "./DynamicBindingUtils";

/**
 * This function updates the header at a given index.
 * If headerIndexToUpdate is -1, i.e the header we are looking for is not present, then
 * update the header key-value pair in the first non-empty row
 * @param headers
 * @param headerIndexToUpdate
 * @returns
 */
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getIndextoUpdate = (headers: any, headerIndexToUpdate: number) => {
  const firstEmptyHeaderRowIndex: number = headers?.findIndex(
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
  const dynamicValuesDetected: string[] = [];
  const matchGroup = url.match(queryParamsRegEx) || [];
  const parsedUrlWithQueryParams = matchGroup[2] || "";

  const dynamicStringSegments = getDynamicStringSegments(
    parsedUrlWithQueryParams,
  );

  const templateStringSegments = dynamicStringSegments.map((segment) => {
    if (isDynamicValue(segment)) {
      dynamicValuesDetected.push(segment);

      return "~";
    }

    return segment;
  });

  if (parsedUrlWithQueryParams.indexOf("?") > -1) {
    const paramsString = templateStringSegments
      .join("")
      .slice(parsedUrlWithQueryParams.indexOf("?") + 1);

    const paramsWithDynamicValues = paramsString.split("&").map((p) => {
      const firstEqualPos = p.indexOf("=");
      const keyValue =
        firstEqualPos > -1
          ? [p.substring(0, firstEqualPos), p.substring(firstEqualPos + 1)]
          : [];

      return { key: keyValue[0] || "", value: keyValue[1] || "" };
    });

    params = paramsWithDynamicValues.map((queryParam) => {
      // this time around we check for both key and values.
      if (queryParam.value.includes("~") || queryParam.key.includes("~")) {
        let newVal = queryParam.value;
        let newKey = queryParam.key;

        if (queryParam.key.includes("~")) {
          newKey = queryParam?.key?.replace(/~/, dynamicValuesDetected[0]);
          // remove the first index from detected dynamic values.
          dynamicValuesDetected.shift();
        }

        if (queryParam.value.includes("~")) {
          newVal = queryParam?.value?.replace(/~/, dynamicValuesDetected[0]);

          // remove the first index from detected dynamic values.
          dynamicValuesDetected.shift();
        }

        // dynamicValuesDetected.shift();
        return { key: newKey, value: newVal };
      }

      return queryParam;
    });
  }

  return params;
}

/**
 *
 * @param headers Array of key value pairs
 * @returns string body type of API request
 */
export function getContentTypeHeaderValue(
  headers: Array<{ key: string; value: string }>,
): string {
  return (
    headers.find(
      (h: { key: string; value: string }) =>
        h.key?.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
    )?.value || ""
  );
}
