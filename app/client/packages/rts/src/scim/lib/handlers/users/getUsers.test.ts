import { getUsers } from "./getUsers";
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
      content: [
        {
          resource: {
            id: "1",
            username: "user1@example.com",
          },
          metadata: {},
        },
        {
          resource: {
            id: "2",
            username: "user+2@example.com",
          },
          metadata: {},
        },
      ],
      total: 2,
    },
  },
});
(validateResponse as jest.Mock).mockResolvedValue(true);

describe("getUsers", () => {
  it("should return an array of users", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const getObj = {};
    const attributes = ["id", "userName"];
    const ctx = {};

    // Call the function and await the result
    const result = await getUsers(baseEntity, getObj, attributes, ctx);

    // Check the returned result
    expect(result).toEqual({
      Resources: [
        {
          id: "1",
          userName: "user1@example.com",
          active: true,
          meta: {},
        },
        {
          id: "2",
          userName: "user+2@example.com",
          active: true,
          meta: {},
        },
      ],
      totalResults: 2,
    });

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "GET",
      "/users",
      null,
      ctx,
    );
  });

  it("should return an array of single user by id", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const getObj = {
      attribute: "id",
      operator: "eq",
      value: "1",
    };
    const attributes = ["id", "userName"];
    const ctx = {};

    (doRequest as jest.Mock).mockResolvedValue({
      body: {
        responseMeta: {
          success: true,
        },
        data: {
          content: [
            {
              resource: {
                id: "1",
                username: "user1@example.com",
              },
              metadata: {},
            },
          ],
          total: 1,
        },
      },
    });
    // Call the function and await the result
    const result = await getUsers(baseEntity, getObj, attributes, ctx);

    // Check the returned result
    expect(result).toEqual({
      Resources: [
        {
          id: "1",
          userName: "user1@example.com",
          active: true,
          meta: {},
        },
      ],
      totalResults: 1,
    });

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "GET",
      "/users/1",
      null,
      ctx,
    );
  });

  it("should return an array of single user filtered by userName", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const getObj = {
      attribute: "userName",
      operator: "eq",
      value: "user+2@example.com",
    };
    const attributes = ["id", "userName"];
    const ctx = {};

    (doRequest as jest.Mock).mockResolvedValue({
      body: {
        responseMeta: {
          success: true,
        },
        data: {
          content: [
            {
              resource: {
                id: "2",
                username: "user+2@example.com",
              },
              metadata: {},
            },
          ],
          total: 1,
        },
      },
    });
    // Call the function and await the result
    const result = await getUsers(baseEntity, getObj, attributes, ctx);

    // Check the returned result
    expect(result).toEqual({
      Resources: [
        {
          id: "2",
          userName: "user+2@example.com",
          active: true,
          meta: {},
        },
      ],
      totalResults: 1,
    });

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "GET",
      "/users?email=user%2B2%40example.com",
      null,
      ctx,
    );
  });

  it("should handle error responses", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const getObj = {
      attribute: "id",
      operator: "eq",
      value: "1",
    };
    const attributes = ["id", "userName"];
    const ctx = {};

    // Mock a failed response from 'doRequest'
    const errorMessage = "Request failed";
    (doRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the function and await the result
    try {
      await getUsers(baseEntity, getObj, attributes, ctx);
    } catch (error) {
      // Check that the error message is propagated
      expect(error.message).toBe(`getUsers error: ${errorMessage}`);
    }
  });
});
