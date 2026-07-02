import { extractExecutionErrorMessage } from "./errorUtils";

describe("extractExecutionErrorMessage", () => {
  it("returns timeout message for Axios ECONNABORTED with timeout pattern", () => {
    const axiosError = Object.assign(new Error("timeout of 10000ms exceeded"), {
      code: "ECONNABORTED",
      isAxiosError: true,
    });

    expect(extractExecutionErrorMessage(axiosError)).toBe(
      "Action execution timed out. Try increasing the timeout in the action settings.",
    );
  });

  it("returns network error message for Axios Network Error", () => {
    const axiosError = Object.assign(new Error("Network Error"), {
      isAxiosError: true,
    });

    expect(extractExecutionErrorMessage(axiosError)).toBe(
      "Network error: could not reach the Appsmith server. Check your connection.",
    );
  });

  it("returns Axios message for other Axios errors", () => {
    const axiosError = Object.assign(
      new Error("Request failed with status code 502"),
      { isAxiosError: true },
    );

    expect(extractExecutionErrorMessage(axiosError)).toBe(
      "Request failed: Request failed with status code 502",
    );
  });

  it("returns Axios message for ECONNABORTED without timeout pattern", () => {
    const axiosError = Object.assign(new Error("connection aborted"), {
      code: "ECONNABORTED",
    });

    expect(extractExecutionErrorMessage(axiosError)).toBe(
      "Request failed: connection aborted",
    );
  });

  it("returns server error message from validateResponse errors", () => {
    const serverError = new Error("Organization not found");

    expect(extractExecutionErrorMessage(serverError)).toBe(
      "Organization not found",
    );
  });

  it("returns 'Response not valid' for non-Error values", () => {
    expect(extractExecutionErrorMessage("string error")).toBe(
      "Response not valid",
    );
    expect(extractExecutionErrorMessage(null)).toBe("Response not valid");
    expect(extractExecutionErrorMessage(undefined)).toBe("Response not valid");
    expect(extractExecutionErrorMessage(42)).toBe("Response not valid");
  });

  it("returns 'Response not valid' for Error with empty message", () => {
    expect(extractExecutionErrorMessage(new Error(""))).toBe(
      "Response not valid",
    );
  });

  it("returns the error message for a plain Error", () => {
    const error = new Error("Something went wrong");

    expect(extractExecutionErrorMessage(error)).toBe("Something went wrong");
  });
});
