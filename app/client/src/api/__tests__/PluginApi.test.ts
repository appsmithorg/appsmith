import PluginsApi from "api/PluginApi";
import Api from "api/Api";
import type { UpcomingIntegration } from "entities/Plugin";

// Mock the Api module with a class that can be extended
jest.mock("api/Api", () => {
  return {
    // Export a class that can be extended
    __esModule: true,
    default: class MockApi {
      static get: jest.Mock = jest.fn();
    },
  };
});

describe("PluginsApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchUpcomingIntegrations", () => {
    it("should call the correct API endpoint", async () => {
      // Setup mock API response
      const mockResponse = {
        data: {
          responseMeta: {
            success: true,
          },
          data: [
            {
              name: "Test Integration",
              iconLocation: "test-icon-location",
            },
            {
              name: "Another Test",
              iconLocation: "another-test-icon",
            },
          ] as UpcomingIntegration[],
        },
      };

      (Api.get as jest.Mock).mockResolvedValue(mockResponse);

      // Call the function
      const result = await PluginsApi.fetchUpcomingIntegrations();

      // Verify API was called correctly
      expect(Api.get).toHaveBeenCalledWith(
        PluginsApi.url + "/upcoming-integrations",
      );

      // Verify response matches mock
      expect(result).toEqual(mockResponse);
    });

    it("should handle API errors", async () => {
      // Setup mock API to throw error
      const mockError = new Error("API error");

      (Api.get as jest.Mock).mockRejectedValue(mockError);

      // Call the function and expect it to throw
      await expect(PluginsApi.fetchUpcomingIntegrations()).rejects.toThrow(
        mockError,
      );

      // Verify API was called
      expect(Api.get).toHaveBeenCalledWith(
        PluginsApi.url + "/upcoming-integrations",
      );
    });
  });
});
