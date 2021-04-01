import { fetchDefaultDocs } from "./utils";

describe("globalsearch utils", () => {
  it("returns default github docs", async () => {
    let documents = [];
    await fetchDefaultDocs(
      (truthy) => {
        // do nothing for now
        // to turn off errors
        expect(truthy === null || typeof truthy === "boolean").toBeTruthy();
      },
      (docs) => {
        documents = docs;
        expect(documents.length).toEqual(4);
      },
      0,
      2,
    );
  });
});
