import {
  apiRequestInterceptor,
  apiSuccessResponseInterceptor,
  apiFailureResponseInterceptor,
  axiosConnectionAbortedCode,
} from "./ApiUtils";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type { ActionExecutionResponse } from "api/ActionAPI";
import {
  createMessage,
  ERROR_0,
  SERVER_API_TIMEOUT_ERROR,
} from "ee/constants/messages";
import { ERROR_CODES } from "ee/constants/ApiConstants";
import * as Sentry from "@sentry/react";

describe("axios api interceptors", () => {
  describe("Axios api request interceptor", () => {
    it("adds timer to the request object", () => {
      const request: AxiosRequestConfig = {
        url: "https://app.appsmith.com/v1/api/actions/execute",
      };
      const interceptedRequest = apiRequestInterceptor(request);
      expect(interceptedRequest).toHaveProperty("timer");
    });
  });

  describe("Axios api response success interceptor", () => {
    it("transforms an action execution response", () => {
      const response: AxiosResponse = {
        data: "Test data",
        headers: {
          "content-length": 123,
          "content-type": "application/json",
        },
        config: {
          url: "https://app.appsmith.com/v1/api/actions/execute",
          // @ts-expect-error: type mismatch
          timer: 0,
        },
      };

      const interceptedResponse: ActionExecutionResponse =
        apiSuccessResponseInterceptor(response);

      expect(interceptedResponse).toHaveProperty("clientMeta");
      expect(interceptedResponse.clientMeta).toHaveProperty("size");
      expect(interceptedResponse.clientMeta.size).toBe(123);
      expect(interceptedResponse.clientMeta).toHaveProperty("duration");
    });

    it("just returns the response data for other requests", () => {
      const response: AxiosResponse = {
        data: "Test data",
        headers: {
          "content-type": "application/json",
        },
        config: {
          url: "https://app.appsmith.com/v1/api/actions",
          //@ts-expect-error: type mismatch
          timer: 0,
        },
      };

      const interceptedResponse: ActionExecutionResponse =
        apiSuccessResponseInterceptor(response);
      expect(interceptedResponse).toBe("Test data");
    });
  });

  describe("Api response failure interceptor", () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it("checks for no internet errors", () => {
      jest.spyOn(navigator, "onLine", "get").mockReturnValue(false);
      const interceptedResponse = apiFailureResponseInterceptor({});
      expect(interceptedResponse).rejects.toStrictEqual({
        message: createMessage(ERROR_0),
      });
    });

    it.todo("handles axios cancel gracefully");

    it("handles timeout errors", () => {
      const error = {
        code: axiosConnectionAbortedCode,
        message: "timeout of 10000ms exceeded",
      };
      const interceptedResponse = apiFailureResponseInterceptor(error);
      expect(interceptedResponse).rejects.toStrictEqual({
        message: createMessage(SERVER_API_TIMEOUT_ERROR),
        code: ERROR_CODES.REQUEST_TIMEOUT,
      });
    });

    it("checks for response meta", () => {
      const sentrySpy = jest.spyOn(Sentry, "captureException");
      const response: AxiosResponse = {
        data: "Test data",
        headers: {
          "content-type": "application/json",
        },
        config: {
          url: "https://app.appsmith.com/v1/api/user",
          //@ts-expect-error: type mismatch
          timer: 0,
        },
      };
      apiSuccessResponseInterceptor(response);
      expect(sentrySpy).toHaveBeenCalled();

      const interceptedFailureResponse = apiFailureResponseInterceptor({
        response,
      });

      expect(interceptedFailureResponse).rejects.toStrictEqual("Test data");
      expect(sentrySpy).toHaveBeenCalled();
    });
  });
});
