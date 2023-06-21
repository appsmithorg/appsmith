import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const apiPage = ObjectsRegistry.ApiPage;

describe("Validate API URL Evaluated value", () => {
  it("1. Check if url object does not crash App", () => {
    apiPage.CreateApi("FirstAPI");
    apiPage.EnterURL(`{{{"key": "value"}}}`, true, `{"key":"value"}`);
  });

  // https://github.com/appsmithorg/appsmith/issues/24696
  it("1. Check if path field strings have not been JSON.stringified - #24696", () => {
    apiPage.CreateApi("SecondAPI");
    apiPage.EnterURL(
      `https://jsonplaceholder.typicode/{{Api1.isLoading}}`,
      true,
      `https://jsonplaceholder.typicode/false`,
    );
  });
});
