import { deleteUser } from "./deleteUser";
import { doRequest, validateResponse } from "@scim/lib/plugin-scim";

// Mock the 'doRequest' function
jest.mock("../../plugin-scim");
jest.mock("scimgateway/lib/scimgateway");
(validateResponse as jest.Mock).mockResolvedValue(true);

describe("deleteUser", () => {
  it("should delete a user and return null", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const userId = "1";
    const ctx = {};

    // Mock a successful response from 'doRequest'
    (doRequest as jest.Mock).mockResolvedValue({
      statusCode: 204,
      statusMessage: "No Content",
      body: null,
    });

    // Call the function and await the result
    const result = await deleteUser(baseEntity, userId, ctx);

    // Check that the result is null
    expect(result).toBeNull();

    // Verify that 'doRequest' was called with the correct arguments
    expect(doRequest).toHaveBeenCalledWith(
      baseEntity,
      "DELETE",
      `/users/${userId}`,
      null,
      ctx,
    );
  });

  it("should handle error responses", async () => {
    // Set up the test data
    const baseEntity = "your-base-entity";
    const userId = "1";
    const ctx = {};

    // Mock a failed response from 'doRequest'
    const errorMessage = "Request failed";
    (doRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Call the function and await the result
    try {
      await deleteUser(baseEntity, userId, ctx);
    } catch (error) {
      // Check that the error message is propagated
      expect(error.message).toBe(`deleteUser error: ${errorMessage}`);
    }
  });
});
