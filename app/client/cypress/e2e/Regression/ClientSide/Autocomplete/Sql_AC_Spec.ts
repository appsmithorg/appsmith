import {
  agHelper,
  locators,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("SQL Autocompletion", { tags: ["@tag.JS", "@tag.Binding"] }, () => {
  it("1. Create DS for SQL autocompletion testing", () => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      //Shows autocompletion hints in SQL", () => {
      dataSources.CreateQueryForDS(dsName);
      dataSources.EnterQuery("");
      agHelper.TypeText(locators._codeMirrorTextArea, "select");
      // Hints should exist
      agHelper.AssertElementExist(locators._hints);
      // "select" should be parsed as a keyword and should not be capitalised
      agHelper.GetNAssertElementText(
        locators._sqlKeyword,
        "select",
        "contain.text",
      );
      // Hints should disappear on mouse down
      cy.get(locators._codeMirrorTextArea).realMouseDown();
      agHelper.AssertElementAbsence(locators._hints);
    });
  });
});
