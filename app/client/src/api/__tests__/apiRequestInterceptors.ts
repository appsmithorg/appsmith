import axios from "axios";
import {
  addGitBranchHeader,
  blockAirgappedRoutes,
  addRequestedByHeader,
  addEnvironmentHeader,
  increaseGitApiTimeout,
  addAnonymousUserIdHeader,
  addPerformanceMonitoringHeaders,
} from "api/interceptors/request";

describe("Api request interceptors", () => {
  beforeAll(() => {
    axios.defaults.adapter = async (config) => {
      return new Promise((resolve) => {
        resolve({
          data: "Test data",
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

  it("checks if the request config has timer in the headers", async () => {
    const url = "v1/actions/execute";
    const identifier = axios.interceptors.request.use(
      addPerformanceMonitoringHeaders,
    );
    const response = await axios.get(url);

    expect(response.config.headers).toHaveProperty("timer");

    axios.interceptors.request.eject(identifier);
  });

  it("checks if the request config has anonymousUserId in the headers", async () => {
    const url = "v1/actions/execute";
    const identifier = axios.interceptors.request.use((config) =>
      addAnonymousUserIdHeader(config, {
        segmentEnabled: true,
        anonymousId: "anonymousUserId",
      }),
    );
    const response = await axios.get(url);

    expect(response.config.headers).toHaveProperty("x-anonymous-user-id");
    expect(response.config.headers["x-anonymous-user-id"]).toBe(
      "anonymousUserId",
    );

    axios.interceptors.request.eject(identifier);
  });

  it("checks if the request config has csrfToken in the headers", async () => {
    const url = "v1/actions/execute";
    const identifier = axios.interceptors.request.use(addRequestedByHeader);
    const response = await axios.post(url);

    expect(response.config.headers).toHaveProperty("X-Requested-By");
    expect(response.config.headers["X-Requested-By"]).toBe("Appsmith");

    axios.interceptors.request.eject(identifier);
  });

  it("checks if the request config has gitBranch in the headers", async () => {
    const url = "v1/";
    const identifier = axios.interceptors.request.use((config) => {
      return addGitBranchHeader(config, { branch: "master" });
    });
    const response = await axios.get(url);

    expect(response.config.headers).toHaveProperty("branchName");
    expect(response.config.headers["branchName"]).toBe("master");

    axios.interceptors.request.eject(identifier);
  });

  it("checks if the request config has environmentId in the headers", async () => {
    const url = "v1/saas";
    const identifier = axios.interceptors.request.use((config) => {
      return addEnvironmentHeader(config, { env: "default" });
    });

    const response = await axios.get(url);

    expect(response.config.headers).toHaveProperty("X-Appsmith-EnvironmentId");
    expect(response.config.headers["X-Appsmith-EnvironmentId"]).toBe("default");

    axios.interceptors.request.eject(identifier);
  });

  it("checks if the request config has airgapped in the headers", async () => {
    const url = "v1/saas";
    const identifier = axios.interceptors.request.use((config) => {
      return blockAirgappedRoutes(config, { isAirgapped: true });
    });
    const response = await axios.get(url);

    expect(response.data).toBeNull();
    expect(response.status).toBe(200);
    expect(response.statusText).toBe("OK");

    axios.interceptors.request.eject(identifier);
  });

  it("checks if the request config has a timeout of 120s", async () => {
    const url = "v1/git/";
    const identifier = axios.interceptors.request.use(increaseGitApiTimeout);
    const response = await axios.get(url);

    expect(response.config.timeout).toBe(120000);

    axios.interceptors.request.eject(identifier);
  });
});
