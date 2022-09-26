import {
  extractFetchDynamicValueFormConfigs,
  extractQueueOfValuesToBeFetched,
} from "sagas/helper";

describe("Fetch dynamic values", () => {
  const testInput = {
    identifier1: {
      visible: true,
      enabled: false,
      fetchDynamicValues: {
        allowedToFetch: true,
        isLoading: true,
        hasStarted: true,
        hasFetchFailed: true,
        data: [],
        config: {
          params: {
            key1: "value1",
          },
        },
        evaluatedConfig: {
          params: {
            key1: "value1",
          },
        },
      },
    },
    identifier2: {
      enabled: true,
    },
    identifier3: {
      fetchDynamicValues: {
        allowedToFetch: false,
        isLoading: true,
        hasStarted: true,
        hasFetchFailed: true,
        data: [],
        config: {
          params: {
            key1: "value1",
          },
        },
        evaluatedConfig: {
          params: {
            key1: "value1",
          },
        },
      },
    },
  };
  it("extract dynamic configs from form evaluation output", () => {
    const testOutput = {
      identifier1: {
        visible: true,
        enabled: false,
        fetchDynamicValues: {
          allowedToFetch: true,
          isLoading: true,
          hasStarted: true,
          hasFetchFailed: true,
          data: [],
          config: {
            params: {
              key1: "value1",
            },
          },
          evaluatedConfig: {
            params: {
              key1: "value1",
            },
          },
        },
      },
      identifier3: {
        fetchDynamicValues: {
          allowedToFetch: false,
          isLoading: true,
          hasStarted: true,
          hasFetchFailed: true,
          data: [],
          config: {
            params: {
              key1: "value1",
            },
          },
          evaluatedConfig: {
            params: {
              key1: "value1",
            },
          },
        },
      },
    };
    expect(extractFetchDynamicValueFormConfigs(testInput)).toEqual(testOutput);
  });

  it("extract config of values that are allowed to fetch from url", () => {
    const testOutput = {
      identifier1: {
        visible: true,
        enabled: false,
        fetchDynamicValues: {
          allowedToFetch: true,
          isLoading: true,
          hasStarted: true,
          hasFetchFailed: true,
          data: [],
          config: {
            params: {
              key1: "value1",
            },
          },
          evaluatedConfig: {
            params: {
              key1: "value1",
            },
          },
        },
      },
    };
    expect(extractQueueOfValuesToBeFetched(testInput)).toEqual(testOutput);
  });
});
