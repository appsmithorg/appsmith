import { createUser } from "./createUser";
import { doRequest, validateResponse } from "@scim/lib/plugin-scim";

// Mock the 'doRequest' function to return a sample response
jest.mock("../../plugin-scim");
jest.mock("scimgateway/lib/scimgateway");
(doRequest as jest.Mock).mockResolvedValue({
  body: {
    responseMeta: {
      success: true,
    },
    data: {
      resource: {
        id: "1",
        username: "user1@example.com",
        email: "user1@example.com",
      },
      metadata: {},
    },
  },
});
(validateResponse as jest.Mock).mockResolvedValue(true);

describe("createUser", () => {
  it("should create a user and return the created user object", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const userObj = {
      userName: "user1@example.com",
      displayName: "User 1",
    };
    const ctx = {};

    // Call the function and await the result
    const result = await createUser(baseEntity, userObj, ctx);

    // Check the returned result
    expect(result).toEqual({
      id: "1",
      userName: "user1@example.com",
      active: true,
      email: "user1@example.com",
      meta: {},
    });

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "POST",
      "/users",
      {
        email: "user1@example.com",
        name: "User 1",
      },
      ctx,
    );
  });

  it("should handle error responses", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const userObj = {
      userName: "user1@example.com",
      displayName: "User 1",
    };
    const ctx = {};

    // Mock a failed response from 'doRequest'
    const errorMessage = "Request failed";
    (doRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the function and await the result
    try {
      await createUser(baseEntity, userObj, ctx);
    } catch (error) {
      // Check that the error message is propagated
      expect(error.message).toBe(`createUser error: ${errorMessage}`);
    }
  });
});
