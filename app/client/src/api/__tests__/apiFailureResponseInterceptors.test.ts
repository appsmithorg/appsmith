import axios, { AxiosError } from "axios";

import {
  apiFailureResponseInterceptor,
  apiSuccessResponseInterceptor,
} from "api/interceptors";
import type { ApiResponse } from "api/types";
import {
  createMessage,
  ERROR_0,
  ERROR_413,
  ERROR_500,
  SERVER_API_TIMEOUT_ERROR,
} from "ee/constants/messages";
import { ERROR_CODES } from "ee/constants/ApiConstants";
import {
  extractExecutionErrorMessage,
  UserCancelledActionExecutionError,
} from "sagas/ActionExecution/errorUtils";

const rejectionOf = async (request: Promise<unknown>) =>
  request.then(
    () => {
      throw new Error("Expected the request to reject");
    },
    (error: unknown) => error,
  );

describe("Api success response interceptors", () => {
  beforeAll(() => {
    axios.interceptors.response.use(
      apiSuccessResponseInterceptor,
      apiFailureResponseInterceptor,
    );
  });

  afterEach(() => {
    axios.defaults.adapter = undefined;
  });

  it("checks 413 error", async () => {
    axios.defaults.adapter = async () => {
      return Promise.reject({
        response: {
          status: 413,
        },
      } as AxiosError);
    };

    try {
      await axios.get("https://example.com");
    } catch (error) {
      expect((error as AxiosError<ApiResponse>).response?.status).toBe(413);
      expect((error as AxiosError<ApiResponse>).message).toBe(
        createMessage(ERROR_413, 100),
      );
      expect(
        (error as AxiosError<ApiResponse> & { statusCode?: string }).statusCode,
      ).toBe("AE-APP-4013");
    }
  });

  it("checks the response message when request is made when user is offline", async () => {
    const onlineGetter: jest.SpyInstance = jest.spyOn(
      window.navigator,
      "onLine",
      "get",
    );

    onlineGetter.mockReturnValue(false);
    axios.defaults.adapter = async () => {
      return new Promise((resolve, reject) => {
        reject({
          message: "Network Error",
        } as AxiosError);
      });
    };

    try {
      await axios.get("https://example.com");
    } catch (error) {
      expect((error as AxiosError<ApiResponse>).message).toBe(
        createMessage(ERROR_0),
      );
    }

    onlineGetter.mockRestore();
    axios.defaults.adapter = undefined;
  });

  it("checks if it throws UserCancelledActionExecutionError user cancels the request ", async () => {
    const cancelToken = axios.CancelToken.source();

    axios.defaults.adapter = async () => {
      return new Promise((resolve, reject) => {
        cancelToken.cancel("User cancelled the request");

        reject({
          message: "User cancelled the request",
        } as AxiosError);
      });
    };

    try {
      await axios.get("https://example.com", {
        cancelToken: cancelToken.token,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(UserCancelledActionExecutionError);
    }
  });

  it("checks the response message when request fails for exeuction action urls", async () => {
    axios.defaults.adapter = async () => {
      return Promise.reject({
        response: {
          status: 500,
          statusText: "Internal Server Error",
          headers: {
            "content-length": 1,
          },
          config: {
            headers: {
              timer: "1000",
            },
          },
        },
        config: {
          url: "/v1/actions/execute",
        },
      });
    };

    const url = "/v1/actions/execute";
    const response = await axios.get(url);

    expect(response).toHaveProperty("clientMeta");
  });

  it("rejects with the original error when an execution action url times out without a response", async () => {
    axios.defaults.adapter = async (config) => {
      return Promise.reject(
        new AxiosError(
          "timeout of 1000ms exceeded",
          AxiosError.ECONNABORTED,
          config,
        ),
      );
    };

    const error = await rejectionOf(axios.post("/v1/actions/execute"));

    expect(error).toBeInstanceOf(AxiosError);
    expect(extractExecutionErrorMessage(error)).toBe(
      "Action execution timed out. Try increasing the timeout in the action settings.",
    );
  });

  it("rejects with the original error when an execution action url has a network error", async () => {
    axios.defaults.adapter = async (config) => {
      return Promise.reject(
        new AxiosError("Network Error", AxiosError.ERR_NETWORK, config),
      );
    };

    const error = await rejectionOf(axios.post("/v1/actions/execute"));

    expect(error).toBeInstanceOf(AxiosError);
    expect(extractExecutionErrorMessage(error)).toBe(
      "Network error: could not reach the Appsmith server. Check your connection.",
    );
  });

  it("checks the error response in case of timeout", async () => {
    axios.defaults.adapter = async () => {
      return Promise.reject({
        code: "ECONNABORTED",
        message: "timeout of 1000ms exceeded",
      });
    };

    try {
      await axios.get("https://example.com");
    } catch (error) {
      expect((error as AxiosError<ApiResponse>).message).toBe(
        createMessage(SERVER_API_TIMEOUT_ERROR),
      );
      expect((error as AxiosError<ApiResponse>).code).toBe(
        ERROR_CODES.REQUEST_TIMEOUT,
      );
    }
  });

  it("checks the error response in case of server error", async () => {
    axios.defaults.adapter = async () => {
      return Promise.reject({
        response: {
          status: 502,
        },
      });
    };

    try {
      await axios.get("https://example.com");
    } catch (error) {
      expect((error as AxiosError<ApiResponse>).message).toBe(
        createMessage(ERROR_500),
      );
      expect((error as AxiosError<ApiResponse>).code).toBe(
        ERROR_CODES.SERVER_ERROR,
      );
    }
  });

  it("checks error response in case of unauthorized error", async () => {
    axios.defaults.adapter = async () => {
      return Promise.reject({
        response: {
          status: 401,
        },
      });
    };

    try {
      await axios.get("https://example.com");
    } catch (error) {
      expect((error as AxiosError<ApiResponse>).message).toBe(
        "Unauthorized. Redirecting to login page...",
      );
      expect((error as AxiosError<ApiResponse>).code).toBe(
        ERROR_CODES.REQUEST_NOT_AUTHORISED,
      );
    }
  });

  it("checks error response in case of not found error", async () => {
    axios.defaults.adapter = async () => {
      return Promise.reject({
        response: {
          data: {
            responseMeta: {
              status: 404,
              error: {
                code: "AE-ACL-4004",
              },
            },
          },
        },
      });
    };

    try {
      await axios.get("https://example.com");
    } catch (error) {
      expect((error as AxiosError<ApiResponse>).message).toBe(
        "Resource Not Found",
      );
      expect((error as AxiosError<ApiResponse>).code).toBe(
        ERROR_CODES.PAGE_NOT_FOUND,
      );
    }
  });
});
