import { deleteGroup } from "./deleteGroup";
import { doRequest, validateResponse } from "@scim/lib/plugin-scim";

// Mock the 'doRequest' function to return a sample response
jest.mock("../../plugin-scim");
jest.mock("scimgateway/lib/scimgateway");
(doRequest as jest.Mock).mockResolvedValue({
  statusCode: 204,
});
(validateResponse as jest.Mock).mockResolvedValue(true);

describe("deleteGroup", () => {
  it("should delete a group", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const id = "1";
    const ctx = {};

    // Call the function and await the result
    const result = await deleteGroup(baseEntity, id, ctx);

    // Check the returned result
    expect(result).toBeNull();

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "DELETE",
      "/groups/1",
      null,
      ctx,
    );
  });

  it("should handle error responses", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const id = "1";
    const ctx = {};

    // Mock a failed response from 'doRequest'
    const errorMessage = "Request failed";
    (doRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the function and await the result
    try {
      await deleteGroup(baseEntity, id, ctx);
    } catch (error) {
      // Check that the error message is propagated
      expect(error.message).toBe(`deleteGroup error: ${errorMessage}`);
    }
  });
});
