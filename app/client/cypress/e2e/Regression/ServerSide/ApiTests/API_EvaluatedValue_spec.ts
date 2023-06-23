import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const apiPage = ObjectsRegistry.ApiPage;

describe("Validate API URL Evaluated value", () => {
  it("1. Check if url object does not crash App", () => {
    apiPage.CreateApi("FirstAPI");
    apiPage.EnterURL(`{{{"key": "value"}}}`, true, `{"key":"value"}`);
  });
});
