import { createGroup } from "./createGroup";
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
        name: "group1",
      },
      metadata: {},
    },
  },
});
(validateResponse as jest.Mock).mockResolvedValue(true);

describe("createGroup", () => {
  it("should create a group and return the created group object", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const groupObj = {
      displayName: "group1",
      description: "Group 1",
      members: [{ value: "user1" }],
    };
    const ctx = {};

    // Call the function and await the result
    const result = await createGroup(baseEntity, groupObj, ctx);

    // Check the returned result
    expect(result).toEqual({
      id: "1",
      displayName: "group1",
      meta: {},
    });

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "POST",
      "/groups",
      {
        name: "group1",
        description: "Group 1",
        users: ["user1"],
      },
      ctx,
    );
  });

  it("should handle error responses", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const groupObj = {
      displayName: "group1",
      description: "Group 1",
      members: [{ value: "user1" }],
    };
    const ctx = {};

    // Mock a failed response from 'doRequest'
    const errorMessage = "Request failed";
    (doRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the function and await the result
    try {
      await createGroup(baseEntity, groupObj, ctx);
    } catch (error) {
      // Check that the error message is propagated
      expect(error.message).toBe(`createGroup error: ${errorMessage}`);
    }
  });
});
