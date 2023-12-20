import axios from "axios";
import type {
  AppsmithExecuteActionDTO,
  ExecuteAppsmithActivityRequest,
  ExecuteInboxCreationRequest,
} from "@workflowProxy/constants/types";
import { validateResponse } from "./utils";

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
      //check if cookie is present in the request, if not throw error
      if (!headers["cookie"]) {
        throw new Error("Cookie not found in request");
      }

      const formData = new FormData();

      const apiRequest: AppsmithExecuteActionDTO = {
        actionId: request.actionId,
        // TODO: viewmode should be passed down as variable, should be true by default also since we will be using deployed workflows only
        viewmode: false,
      };
      formData.append("executeActionDTO", JSON.stringify(apiRequest));

      // TODO: pass the user params also here
      // formData.append("userParams", JSON.stringify({}));

      const reqHeaders = {
        cookie: headers["cookie"],
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
      //check if cookie is present in the request, if not throw error
      if (!headers["cookie"]) {
        throw new Error("Cookie not found in request");
      }

      // create an axios post request
      const reqHeaders = {
        cookie: headers["cookie"],
        "Content-Type": "application/json",
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
