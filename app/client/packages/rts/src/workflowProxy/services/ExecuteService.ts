import axios from "axios";
import type {
  AppsmithExecuteActionDTO,
  ExecuteAppsmithActivityRequest,
  ExecuteInboxCreationRequest,
} from "@workflowProxy/constants/types";
import { findDatatype, validateResponse } from "./utils";

const baseUrl =
  process.env.APPSMITH_API_BASE_URL || "http://localhost:8080/api/v1";

const EXECUTE_ACTION_ENDPOINT = `${baseUrl}/actions/execute`;
const CREATE_INBOX_ENDPOINT = `${baseUrl}/workflows/approvalRequest`;

export class ExecuteService {
  /**
   * Executes the action in appsmith by calling the appsmith API
   * @param request Contains actionId and workflowInstanceId for the action to be executed
   * @param headers Headers from the request, to be passed to appsmith API
   * @returns
   */
  static async executeActivity(
    request: ExecuteAppsmithActivityRequest,
    headers: Record<string, any>,
  ): Promise<any> {
    try {
      if (!headers["cookie"] && !headers["x-appsmith-key"]) {
        throw new Error("Cookie or Token not found in request");
      }

      const formData = new FormData();
      const paramProperties = {};
      const parameterMap = {};
      const blobArrays = [];

      if (request.inputParams.length > 0) {
        const inputParams = request.inputParams[0];
        const inputParamsEntries = Object.entries({ ...inputParams });
        inputParamsEntries.forEach(([key, value], index) => {
          const varName = `k${index}`;
          const dataType = findDatatype(value);
          paramProperties[varName] = {
            dataType,
            blobIdentifiers: [],
          };
          if (dataType === "object") value = JSON.stringify(value);

          parameterMap[`this.params.${key}`] = varName;
          blobArrays.push({
            name: varName,
            value: new Blob([value], { type: "text/plain" }),
          });
        });

        // We need to send `this.params` as a blob as well so that it can be parsed
        // if the action is expecting an object
        const allParamsValue = JSON.stringify({ ...inputParams });
        const blobValue = new Blob([allParamsValue]);
        const varName = `k${inputParamsEntries.length}`;
        paramProperties[varName] = {
          dataType: findDatatype(inputParams),
          blobIdentifiers: [],
        };
        parameterMap["this.params"] = varName;
        blobArrays.push({
          name: varName,
          value: blobValue,
        });
      }

      const apiRequest: AppsmithExecuteActionDTO = {
        actionId: request.actionId,
        viewmode: true,
        paramProperties,
      };
      formData.append("executeActionDTO", JSON.stringify(apiRequest));

      if (blobArrays.length > 0) {
        formData.append("parameterMap", JSON.stringify(parameterMap));
        blobArrays.forEach((blob) => {
          formData.append(blob.name, blob.value);
        });
      }

      const reqHeaders = {
        "X-Requested-By": "Appsmith",
        "Content-Type": "multipart/form-data",
      };

      if (headers["cookie"]) {
        reqHeaders["cookie"] = headers["cookie"];
      }

      if (headers["x-appsmith-key"]) {
        reqHeaders["x-appsmith-key"] = headers["x-appsmith-key"];
      }

      const response = await axios.post(EXECUTE_ACTION_ENDPOINT, formData, {
        headers: reqHeaders,
      });

      if (validateResponse(response)) {
        return {
          success: true,
          message: "",
          data: { ...response.data.data },
        };
      } else {
        return {
          success: false,
          message: response.data.responseMeta.error.message,
          data: {},
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: { error },
      };
    }
  }

  /**
   * Creates an inbox request in appsmith by calling the appsmith API
   * @param request Contains actionId and workflowInstanceId for the request to be created
   * @param headers Headers from the request, to be passed to appsmith API
   * @returns
   */
  static async executeInboxCreationRequest(
    request: ExecuteInboxCreationRequest,
    headers: Record<string, any>,
  ): Promise<any> {
    try {
      //check if cookie is present in the request, if not throw error
      if (!headers["cookie"] && !headers["x-appsmith-key"]) {
        throw new Error("Cookie or Token not found in request");
      }

      // create an axios post request
      const reqHeaders = {
        "Content-Type": "application/json",
        "X-Requested-By": "Appsmith",
      };
      if (headers["cookie"]) {
        reqHeaders["cookie"] = headers["cookie"];
      }

      if (headers["x-appsmith-key"]) {
        reqHeaders["x-appsmith-key"] = headers["x-appsmith-key"];
      }

      //send the request to appsmith api
      const response = await axios.post(CREATE_INBOX_ENDPOINT, request, {
        headers: reqHeaders,
      });

      //check if the response is valid
      if (validateResponse(response)) {
        return {
          success: true,
          message: "",
          data: { ...response.data.data },
        };
      } else {
        return {
          success: false,
          message: response.data.responseMeta.error.message,
          data: {},
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: { error },
      };
    }
  }
}
