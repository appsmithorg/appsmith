import { apiPage } from "../../../../support/Objects/ObjectsCore";

describe(
  "Name uniqueness test",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Validate Unique Name", () => {
      apiPage.CreateApi("Uni"); //Creation of UniqueName Action successful
      cy.CreationOfUniqueAPIcheck("Uni");
      //2. Validate download apiname check
      cy.CreationOfUniqueAPIcheck("download");
      //3. Validate dedicated worker scope object property(Blob)apiname check
      cy.CreationOfUniqueAPIcheck("Blob");
      // expect(2 + 2).to.equal(5);
    });
  },
);
