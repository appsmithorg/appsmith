import axios from "axios";
import { apiSuccessResponseInterceptor } from "api/interceptors";

describe("Api success response interceptors", () => {
  beforeAll(() => {
    axios.interceptors.response.use(apiSuccessResponseInterceptor);
    axios.defaults.adapter = async (config) => {
      return new Promise((resolve) => {
        resolve({
          data: {
            data: "Test data",
          },
          status: 200,
          statusText: "OK",
          headers: {
            "content-length": 123,
            "content-type": "application/json",
          },
          config,
        });
      });
    };
  });

  it("checks response for non-action-execution url", async () => {
    const url = "/v1/sass";
    const response = await axios.get(url);

    expect(response.data).toBe("Test data");
  });

  it("checks response for action-execution url", async () => {
    const url = "/v1/actions/execute";
    const response = await axios.get(url);

    expect(response).toHaveProperty("data");
    expect(response.data).toBe("Test data");
    expect(response).toHaveProperty("clientMeta");
  });
});
