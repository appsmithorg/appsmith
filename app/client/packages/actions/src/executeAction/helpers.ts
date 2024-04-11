// Function that updates the blob data in the action payload for large file

import { get, isArrayBuffer, set } from "lodash";
import type { ExecuteActionRequest } from "./types";
import { FILE_SIZE_LIMIT_FOR_BLOBS, FileDataTypes } from "./constants";

// uploads
export function updateBlobDataFromUrls(
  blobUrlPaths: Record<string, string>,
  newVal: any,
  blobMap: string[],
  blobDataMap: Record<string, Blob>,
) {
  Object.entries(blobUrlPaths as Record<string, string>).forEach(
    // blobUrl: string eg: blob:1234-1234-1234?type=binary
    ([path, blobUrl]) => {
      if (isArrayBuffer(newVal[path])) {
        // remove the ?type=binary from the blob url if present
        const sanitisedBlobURL = blobUrl.split("?")[0];
        blobMap.push(sanitisedBlobURL);
        set(blobDataMap, sanitisedBlobURL, new Blob([newVal[path]]));
        set(newVal, path, sanitisedBlobURL);
      }
    },
  );
}

/**
 * This function finds the datatype of the given value.
 * typeof, lodash and others will return false positives for things like array, wrapper objects, etc
 * @param value
 * @returns datatype of the received value as string
 */
export const findDatatype = (value: unknown) => {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
};

// For the times when you need to know if something truly an object like { a: 1, b: 2}
// typeof, lodash.isObject and others will return false positives for things like array, null, etc
export const isTrueObject = (
  item: unknown,
): item is Record<string, unknown> => {
  return Object.prototype.toString.call(item) === "[object Object]";
};

export const isBlobUrl = (url: string) => {
  return typeof url === "string" && url.startsWith("blob:");
};

/**
 *
 * @param blobId string blob id along with type.
 * @returns [string,string] [blobUrl, type]
 */
export const parseBlobUrl = (blobId: string) => {
  const url = `blob:${window.location.origin}/${blobId.substring(5)}`;
  return url.split("?type=");
};

/**
 *
 * @param blobUrl string A blob url with type added a query param
 * @returns promise that resolves to file content
 */
export const readBlob = async (blobUrl: string) => {
  const [url, fileType] = parseBlobUrl(blobUrl);
  const file = await fetch(url).then(async (r) => r.blob());

  return await new Promise((resolve) => {
    const reader = new FileReader();
    if (fileType === FileDataTypes.Base64) {
      reader.readAsDataURL(file);
    } else if (fileType === FileDataTypes.Binary) {
      if (file.size < FILE_SIZE_LIMIT_FOR_BLOBS) {
        //check size of the file, if less than 5mb, go with binary string method
        // TODO: this method is deprecated, use readAsText instead
        reader.readAsBinaryString(file);
      } else {
        // For files greater than 5 mb, use array buffer method
        // This is to remove the bloat from the file which is added
        // when using read as binary string method
        reader.readAsArrayBuffer(file);
      }
    } else {
      reader.readAsText(file);
    }
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};

/**
 * This function resolves :
 * - individual objects containing blob urls
 * - blob urls directly
 * - else returns the value unchanged
 * - finds datatype of evaluated value
 * - binds dataype to payload
 *
 * @param value
 */

export const resolvingBlobUrls = async (
  value: any,
  executeActionRequest: ExecuteActionRequest,
  index: number,
  isArray?: boolean,
  arrDatatype?: string[],
) => {
  //Get datatypes of evaluated value.
  const dataType: string = findDatatype(value);
  //If array elements then dont push datatypes to payload.
  isArray
    ? arrDatatype?.push(dataType)
    : (executeActionRequest.paramProperties[`k${index}`] = {
        datatype: dataType,
      });

  if (isTrueObject(value)) {
    const blobUrlPaths: string[] = [];
    Object.keys(value).forEach((propertyName) => {
      if (isBlobUrl(value[propertyName])) {
        blobUrlPaths.push(propertyName);
      }
    });

    for (const blobUrlPath of blobUrlPaths) {
      const blobUrl = value[blobUrlPath] as string;
      const resolvedBlobValue: unknown = await readBlob(blobUrl);
      set(value, blobUrlPath, resolvedBlobValue);

      // We need to store the url path map to be able to update the blob data
      // and send the info to server

      // Here we fetch the blobUrlPathMap from the action payload and update it
      const blobUrlPathMap = get(value, "blobUrlPaths", {}) as Record<
        string,
        string
      >;
      set(blobUrlPathMap, blobUrlPath, blobUrl);
      set(value, "blobUrlPaths", blobUrlPathMap);
    }
  } else if (isBlobUrl(value)) {
    value = await readBlob(value);
  }

  return value;
};
export function* resolvingBlobUrls2(
  value: any,
  executeActionRequest: ExecuteActionRequest,
  index: number,
  isArray?: boolean,
  arrDatatype?: string[],
) {
  //Get datatypes of evaluated value.
  const dataType: string = findDatatype(value);
  //If array elements then dont push datatypes to payload.
  isArray
    ? arrDatatype?.push(dataType)
    : (executeActionRequest.paramProperties[`k${index}`] = {
        datatype: dataType,
      });

  if (isTrueObject(value)) {
    const blobUrlPaths: string[] = [];
    Object.keys(value).forEach((propertyName) => {
      if (isBlobUrl(value[propertyName])) {
        blobUrlPaths.push(propertyName);
      }
    });

    for (const blobUrlPath of blobUrlPaths) {
      const blobUrl = value[blobUrlPath] as string;
      const resolvedBlobValue: unknown = yield readBlob(blobUrl);
      set(value, blobUrlPath, resolvedBlobValue);

      // We need to store the url path map to be able to update the blob data
      // and send the info to server

      // Here we fetch the blobUrlPathMap from the action payload and update it
      const blobUrlPathMap = get(value, "blobUrlPaths", {}) as Record<
        string,
        string
      >;
      set(blobUrlPathMap, blobUrlPath, blobUrl);
      set(value, "blobUrlPaths", blobUrlPathMap);
    }
  } else if (isBlobUrl(value)) {
    // @ts-expect-error: Values can take many types
    value = yield call(readBlob, value);
  }

  return value;
}
