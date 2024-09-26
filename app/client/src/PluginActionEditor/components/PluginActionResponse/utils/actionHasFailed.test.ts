import actionHasFailed from "./actionHasFailed";
import type { ActionResponse } from "api/ActionAPI";

describe("actionHasFailed", () => {
  it("Should only check the status code", () => {
    const input: ActionResponse = {
      body: "Success",
      dataTypes: [],
      duration: "200",
      headers: {},
      size: "200",
      statusCode: "404",
    };

    expect(actionHasFailed(input)).toBe(true);
  });

  it("Checks the 200 series of status code", () => {
    const input: ActionResponse = {
      body: "Success",
      dataTypes: [],
      duration: "200",
      headers: {},
      size: "200",
      statusCode: "201",
    };

    expect(actionHasFailed(input)).toBe(false);
  });
});
