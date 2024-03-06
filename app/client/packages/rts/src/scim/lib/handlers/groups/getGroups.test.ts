import { getGroups } from "./getGroups";
import { doRequest, validateResponse } from "@scim/lib/plugin-scim";

// Mock the 'doRequest' function to return a sample response
jest.mock("../../plugin-scim");
jest.mock("scimgateway/lib/scimgateway");
(doRequest as jest.Mock).mockResolvedValue({
  statusCode: 200,
  body: {
    data: {
      content: [
        {
          resource: {
            id: "1",
            name: "group1",
            description: "Group 1",
            users: ["user1"],
          },
          metadata: {},
        },
        {
          resource: {
            id: "2",
            name: "group2",
            description: "Group 2",
            users: ["user2", "user3"],
          },
          metadata: {},
        },
      ],
      total: 2,
    },
  },
});
(validateResponse as jest.Mock).mockResolvedValue(true);

describe("getGroups", () => {
  it("should return an array of groups", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const getObj = {};
    const attributes = ["id", "displayName", "members"];
    const ctx = {};

    // Call the function and await the result
    const result = await getGroups(baseEntity, getObj, attributes, ctx);

    // Check the returned result
    expect(result).toEqual({
      Resources: [
        {
          id: "1",
          displayName: "group1",
          description: "Group 1",
          members: [{ value: "user1", type: "User" }],
          meta: {},
        },
        {
          id: "2",
          displayName: "group2",
          description: "Group 2",
          members: [
            { value: "user2", type: "User" },
            { value: "user3", type: "User" },
          ],
          meta: {},
        },
      ],
      totalResults: 2,
    });

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "GET",
      "/groups",
      null,
      ctx,
    );
  });

  it("should return an array of single group by id", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const getObj = {
      attribute: "id",
      operator: "eq",
      value: "1",
      rawFilter: "",
      startIndex: 0,
      count: 10,
    };
    const attributes = ["id", "displayName", "members"];
    const ctx = {};

    (doRequest as jest.Mock).mockResolvedValue({
      statusCode: 200,
      body: {
        data: {
          content: [
            {
              resource: {
                id: "1",
                name: "group1",
                description: "Group 1",
                users: ["user1"],
              },
              metadata: {},
            },
          ],
          total: 1,
        },
      },
    });

    // Call the function and await the result
    const result = await getGroups(baseEntity, getObj, attributes, ctx);

    // Check the returned result
    expect(result).toEqual({
      Resources: [
        {
          id: "1",
          displayName: "group1",
          description: "Group 1",
          members: [{ value: "user1", type: "User" }],
          meta: {},
        },
      ],
      totalResults: 1,
    });

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "GET",
      "/groups/1",
      null,
      ctx,
    );
  });

  it("should return an array of single group filtered by displayName", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const getObj = {
      attribute: "displayName",
      operator: "eq",
      value: "group2",
    };
    const attributes = ["id", "displayName", "members"];
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
                name: "group2",
                description: "Group 2",
                users: ["user2", "user3"],
              },
              metadata: {},
            },
          ],
          total: 1,
        },
      },
    });
    // Call the function and await the result
    const result = await getGroups(baseEntity, getObj, attributes, ctx);

    // Check the returned result
    expect(result).toEqual({
      Resources: [
        {
          id: "2",
          displayName: "group2",
          description: "Group 2",
          members: [
            { value: "user2", type: "User" },
            { value: "user3", type: "User" },
          ],
          meta: {},
        },
      ],
      totalResults: 1,
    });

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "GET",
      "/groups?displayName=group2",
      null,
      ctx,
    );
  });

  it("should return an array of groups filtered by userId", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const getObj = {
      attribute: "members.value",
      operator: "eq",
      value: "user1",
    };
    const attributes = ["id", "displayName", "members"];
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
                name: "group1",
                description: "Group 1",
                users: ["user1"],
              },
              metadata: {},
            },
          ],
          total: 1,
        },
      },
    });
    // Call the function and await the result
    const result = await getGroups(baseEntity, getObj, attributes, ctx);

    // Check the returned result
    expect(result).toEqual({
      Resources: [
        {
          id: "1",
          displayName: "group1",
          description: "Group 1",
          members: [{ value: "user1", type: "User" }],
          meta: {},
        },
      ],
      totalResults: 1,
    });

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "GET",
      "/groups?userId=user1",
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
      rawFilter: "",
      startIndex: 0,
      count: 10,
    };
    const attributes = ["id", "displayName", "members"];
    const ctx = {};

    // Mock a failed response from 'doRequest'
    const errorMessage = "Request failed";
    (doRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the function and await the result
    try {
      await getGroups(baseEntity, getObj, attributes, ctx);
    } catch (error) {
      // Check that the error message is propagated
      expect(error.message).toBe(`getGroups error: ${errorMessage}`);
    }
  });
});
