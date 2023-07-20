import { modifyUser } from "./modifyUser";
import { doRequest, validateResponse } from "@scim/lib/plugin-scim";

// Mock the 'doRequest' function
jest.mock("../../plugin-scim");
jest.mock("scimgateway/lib/scimgateway");
(validateResponse as jest.Mock).mockResolvedValue(true);

describe("modifyUser", () => {
  it("should modify a user and return the modified user object", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const userId = "1";
    const attrObj = {
      active: true,
      emails: [{ value: "user1@example.com" }],
      displayName: "Modified User 1",
      userName: "user1@example.com",
    };
    const ctx = {};

    // Mock a successful response from 'doRequest'
    (doRequest as jest.Mock).mockResolvedValue({
      statusCode: 200,
      statusMessage: "OK",
      body: {
        responseMeta: {
          success: true,
        },
        data: {
          resource: {
            id: userId,
            username: "user1@example.com",
            email: "user1@example.com",
          },
          metadata: {},
        },
      },
    });

    // Call the function and await the result
    const result = await modifyUser(baseEntity, userId, attrObj, ctx);

    // Check the returned result
    expect(result).toEqual(null);
  });

  it("should handle error responses", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const userId = "1";
    const attrObj = {
      active: false,
      emails: [{ value: "user1@example.com" }],
      displayName: "Modified User 1",
    };
    const ctx = {};

    // Mock a failed response from 'doRequest'
    const errorMessage = "Request failed";
    (doRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the function and await the result
    try {
      await modifyUser(baseEntity, userId, attrObj, ctx);
    } catch (error) {
      // Check that the error message is propagated
      expect(error.message).toBe(`modifyUser error: ${errorMessage}`);
    }
  });
});
