import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("SQL Autocompletion", () => {
  it("1. Create DS for SQL autocompletion testing", () => {
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      //Shows autocompletion hints in SQL", () => {
      _.dataSources.NavigateFromActiveDS(dsName, true);
      _.agHelper.GetNClick(_.dataSources._templateMenu);
      _.agHelper.TypeText(_.locators._codeMirrorTextArea, "select");
      // Hints should exist
      _.agHelper.AssertElementExist(_.locators._hints);
      // "select" should be parsed as a keyword and should not be capitalised
      _.agHelper.GetNAssertElementText(
        _.locators._sqlKeyword,
        "select",
        "contain.text",
      );
    });
  });
});
