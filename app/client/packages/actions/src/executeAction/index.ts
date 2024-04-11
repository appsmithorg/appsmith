import { isArray, isEmpty, isNil, unset } from "lodash";
import { resolvingBlobUrls, updateBlobDataFromUrls } from "./helpers";
import type {
  ExecuteActionRequest,
  FilePickerInstumentationObject,
} from "./types";

function evaluateActionBindings2(
  bindings: string[],
  executionParams?: string | Record<string, any>,
) {
  const values = [];
  if (!!executionParams) {
    values.push(executionParams);
    values.push(...Object.values(executionParams));
  }
  return values;
}

/**
 * Api1
 * URL: https://example.com/{{Text1.text}}
 * Body: {
 *     "name": "{{this.params.name}}",
 *     "age": {{this.params.age}},
 *     "gender": {{Dropdown1.selectedOptionValue}}
 * }
 *
 * If you call
 * Api1.run(undefined, undefined, { name: "Hetu", age: Input1.text });
 *
 * executionParams is { name: "Hetu", age: Input1.text }
 * bindings is [
 *   "Text1.text",
 *   "Dropdown1.selectedOptionValue",
 *   "this.params.name",
 *   "this.params.age",
 * ]
 *
 * Return will be [
 *   { key: "Text1.text", value: "updateUser" },
 *   { key: "Dropdown1.selectedOptionValue", value: "M" },
 *   { key: "this.params.name", value: "Hetu" },
 *   { key: "this.params.age", value: 26 },
 * ]
 * @param bindings
 * @param executionParams
 */
export function* generateExecuteActionPayload(
  bindings: string[] | undefined,
  formData: FormData,
  executeActionRequest: ExecuteActionRequest,
  filePickerInstrumentation: FilePickerInstumentationObject,
  executionParams?: Record<string, any> | string,
  evaluateActionBindings?: (
    bindings: string[],
    executionParams?: Record<string, any> | string,
  ) => any,
) {
  if (isNil(bindings) || bindings.length === 0) {
    formData.append("executeActionDTO", JSON.stringify(executeActionRequest));
    return [];
  }

  let values;
  if (!evaluateActionBindings) {
    values = evaluateActionBindings2(bindings, executionParams);
  } else {
    // @ts-expect-error values can be any type
    values = yield evaluateActionBindings(bindings, executionParams);
  }

  const bindingsMap: Record<string, string> = {};
  const bindingBlob = [];

  // Maintain a blob data map to resolve blob urls of large files as array buffer
  const blobDataMap: Record<string, Blob> = {};

  let recordFilePickerInstrumentation = false;

  // if json bindings have filepicker reference, we need to init the instrumentation object
  // which we will send post execution
  recordFilePickerInstrumentation = bindings.some((binding) =>
    binding.includes(".files"),
  );

  // Add keys values to formData for the multipart submission
  for (let i = 0; i < bindings.length; i++) {
    const key = bindings[i];
    let value = isArray(values) && values[i];

    let useBlobMaps = false;
    // Maintain a blob map to resolve blob urls of large files
    const blobMap: Array<string> = [];

    if (isArray(value)) {
      const tempArr = [];
      const arrDatatype: Array<string> = [];
      // array of objects containing blob urls that is loops and individual object is checked for resolution of blob urls.
      for (const val of value) {
        let newVal: Record<string, any> = {};
        resolvingBlobUrls(val, executeActionRequest, i, true, arrDatatype).then(
          (v) => {
            newVal = v;
          },
        );

        if (newVal.hasOwnProperty("blobUrlPaths")) {
          updateBlobDataFromUrls(
            newVal.blobUrlPaths,
            newVal,
            blobMap,
            blobDataMap,
          );
          useBlobMaps = true;
          unset(newVal, "blobUrlPaths");
        }

        tempArr.push(newVal);

        if (key.includes(".files") && recordFilePickerInstrumentation) {
          filePickerInstrumentation["numberOfFiles"] += 1;
          const { size, type } = newVal;
          filePickerInstrumentation["totalSize"] += size;
          filePickerInstrumentation["fileSizes"].push(size);
          filePickerInstrumentation["fileTypes"].push(type);
        }
      }
      //Adding array datatype along with the datatype of first element of the array
      executeActionRequest.paramProperties[`k${i}`] = {
        datatype: { array: [arrDatatype[0]] },
      };
      value = tempArr;
    } else {
      resolvingBlobUrls(value, executeActionRequest, i).then((v) => {
        value = v;
      });
      if (key.includes(".files") && recordFilePickerInstrumentation) {
        filePickerInstrumentation["numberOfFiles"] += 1;
        filePickerInstrumentation["totalSize"] += value.size;
        filePickerInstrumentation["fileSizes"].push(value.size);
        filePickerInstrumentation["fileTypes"].push(value.type);
      }
    }

    if (typeof value === "object") {
      // This is used in cases of large files, we store the bloburls with the path they were set in
      // This helps in creating a unique map of blob urls to blob data when passing to the server
      if (!!value && value.hasOwnProperty("blobUrlPaths")) {
        updateBlobDataFromUrls(value.blobUrlPaths, value, blobMap, blobDataMap);
        unset(value, "blobUrlPaths");
      }
      value = JSON.stringify(value);
    }

    // If there are no blob urls in the value, we can directly add it to the formData
    // If there are blob urls, we need to add them to the blobDataMap
    if (!useBlobMaps) {
      value = new Blob([value], { type: "text/plain" });
    }
    bindingsMap[key] = `k${i}`;
    bindingBlob.push({ name: `k${i}`, value: value });

    // We need to add the blob map to the param properties
    // This will allow the server to handle the scenaio of large files upload using blob data
    const paramProperties = executeActionRequest.paramProperties[`k${i}`];
    if (!!paramProperties && typeof paramProperties === "object") {
      paramProperties["blobIdentifiers"] = blobMap;
    }
  }

  formData.append("executeActionDTO", JSON.stringify(executeActionRequest));
  formData.append("parameterMap", JSON.stringify(bindingsMap));
  bindingBlob?.forEach((item) => formData.append(item.name, item.value));

  // Append blob data map to formData if not empty
  if (!isEmpty(blobDataMap)) {
    // blobDataMap is used to resolve blob urls of large files as array buffer
    // we need to add each blob data to formData as a separate entry
    Object.entries(blobDataMap).forEach(([path, blobData]) =>
      formData.append(path, blobData),
    );
  }
}
