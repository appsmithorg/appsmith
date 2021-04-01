import { fetchDefaultDocs } from "./utils";

describe("globalsearch utils", () => {
  it("returns default github docs", async () => {
    let documents = [];
    await fetchDefaultDocs(
      (b) => {
        // do nothing for now
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
