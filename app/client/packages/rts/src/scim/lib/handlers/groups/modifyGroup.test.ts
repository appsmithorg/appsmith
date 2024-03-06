import { modifyGroup } from "./modifyGroup";
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
        members: ["user1"],
      },
      metadata: {},
    },
  },
});
(validateResponse as jest.Mock).mockResolvedValue(true);

describe("modifyGroup", () => {
  it("should modify a group and return the modified group object", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const id = "1";
    const attrObj = {
      displayName: "modifiedGroup",
      description: "Modified Group",
      members: [
        { value: "user1", operation: "add" },
        { value: "user2", operation: "delete" },
      ],
    };
    const ctx = {};

    // Call the function and await the result
    const result = await modifyGroup(baseEntity, id, attrObj, ctx);

    // Check the returned result
    expect(result).toEqual(null);

    // Verify that 'doRequest' was called with the correct arguments for modifying group details
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "PUT",
      "/groups/1",
      {
        name: "modifiedGroup",
        description: "Modified Group",
        users: ["user1"],
      },
      ctx,
    );

    // Verify that 'doRequest' was called with the correct arguments for removing users
    expect(doRequest).not.toHaveBeenCalledWith(
      baseEntity,
      "POST",
      "/groups/removeUsers",
      {
        groupIds: ["1"],
        userIds: ["user2"],
      },
      ctx,
    );

    // Verify that 'doRequest' was called with the correct arguments for inviting users
    expect(doRequest).not.toHaveBeenCalledWith(
      baseEntity,
      "POST",
      "/groups/invite",
      {
        groupIds: ["1"],
        userIds: ["user1"],
      },
      ctx,
    );
  });

  it("should modify a group to add users and return the modified group object", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const id = "1";
    const attrObj = {
      members: [{ value: "user1", operation: "add" }],
    };
    const ctx = {};

    // Call the function and await the result
    const result = await modifyGroup(baseEntity, id, attrObj, ctx);

    // Check the returned result
    expect(result).not.toEqual(null);

    // Verify that 'doRequest' was called with the correct arguments for modifying group details
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "PUT",
      "/groups/1",
      {
        name: "modifiedGroup",
        description: "Modified Group",
        users: ["user1"],
      },
      ctx,
    );

    // Verify that 'doRequest' was called with the correct arguments for removing users
    expect(doRequest).not.toHaveBeenCalledWith(
      baseEntity,
      "POST",
      "/groups/removeUsers",
      {
        groupIds: ["1"],
        userIds: ["user2"],
      },
      ctx,
    );

    // Verify that 'doRequest' was called with the correct arguments for inviting users
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "POST",
      "/groups/invite",
      {
        groupIds: ["1"],
        userIds: ["user1"],
      },
      ctx,
    );
  });

  it("should handle error responses", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const id = "1";
    const attrObj = {
      name: "modifiedGroup",
      description: "Modified Group",
      members: [
        { value: "user1", operation: "add" },
        { value: "user2", operation: "delete" },
      ],
    };
    const ctx = {};

    // Mock a failed response from 'doRequest'
    const errorMessage = "Request failed";
    (doRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the function and await the result
    try {
      await modifyGroup(baseEntity, id, attrObj, ctx);
    } catch (error) {
      // Check that the error message is propagated
      expect(error.message).toBe(`modifyGroup error: ${errorMessage}`);
    }
  });
});
