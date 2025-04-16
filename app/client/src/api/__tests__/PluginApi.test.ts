import type { PremiumIntegration, UpcomingIntegration } from "api/PluginApi";
import PluginsApi from "api/PluginApi";
import Api from "api/Api";

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

  describe("fetchPremiumIntegrations", () => {
    it("should transform API response to PremiumIntegration format", async () => {
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
      const result = await PluginsApi.fetchPremiumIntegrations([]);

      // Verify API was called correctly
      expect(Api.get).toHaveBeenCalledWith("/upcoming-integrations");

      // Verify transformation
      expect(result).toEqual([
        {
          name: "Test Integration",
          icon: "test-icon-location",
        },
        {
          name: "Another Test",
          icon: "another-test-icon",
        },
      ] as PremiumIntegration[]);
    });

    it("should return default integrations when API fails", async () => {
      // Setup mock API to throw error
      (Api.get as jest.Mock).mockRejectedValue(new Error("API error"));

      // Default integrations to return on failure
      const defaultIntegrations: PremiumIntegration[] = [
        {
          name: "Default Integration",
          icon: "default-icon-location",
        },
      ];

      // Call the function
      const result =
        await PluginsApi.fetchPremiumIntegrations(defaultIntegrations);

      // Verify API was called
      expect(Api.get).toHaveBeenCalledWith("/upcoming-integrations");

      // Verify default integrations are returned
      expect(result).toEqual(defaultIntegrations);
    });

    it("should return default integrations when API returns empty data", async () => {
      // Setup mock API response with empty data
      const mockEmptyResponse = {
        data: {
          responseMeta: {
            success: true,
          },
          data: [] as UpcomingIntegration[],
        },
      };

      (Api.get as jest.Mock).mockResolvedValue(mockEmptyResponse);

      // Default integrations to return on empty response
      const defaultIntegrations: PremiumIntegration[] = [
        {
          name: "Default Integration",
          icon: "default-icon-location",
        },
      ];

      // Call the function
      const result =
        await PluginsApi.fetchPremiumIntegrations(defaultIntegrations);

      // Verify default integrations are returned
      expect(result).toEqual(defaultIntegrations);
    });

    it("should return default integrations when API returns unsuccessful response", async () => {
      // Setup mock unsuccessful API response
      const mockUnsuccessfulResponse = {
        data: {
          responseMeta: {
            success: false,
          },
          data: null,
        },
      };

      (Api.get as jest.Mock).mockResolvedValue(mockUnsuccessfulResponse);

      // Default integrations to return on unsuccessful response
      const defaultIntegrations: PremiumIntegration[] = [
        {
          name: "Default Integration",
          icon: "default-icon-location",
        },
      ];

      // Call the function
      const result =
        await PluginsApi.fetchPremiumIntegrations(defaultIntegrations);

      // Verify default integrations are returned
      expect(result).toEqual(defaultIntegrations);
    });
  });
});
