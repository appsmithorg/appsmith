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
        ...headers,
        "X-Requested-By": "Appsmith",
        "Content-Type": "multipart/form-data",
      };

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
      // create an axios post request
      const reqHeaders = {
        ...headers,
        "Content-Type": "application/json",
        "X-Requested-By": "Appsmith",
      };

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
