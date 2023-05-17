const dsl = require("../../../../fixtures/basicTabledsl.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");

describe("Tab widget test", function () {
  const apiName = "Table1";
  const tableName = "Table";
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Rename API with table widget name validation test", function () {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateApiAndValidateUniqueEntityName(apiName);
    cy.get(apiwidget.apiTxt)
      .clear()
      .type(tableName, { force: true })
      .should("have.value", tableName);
    //Rename Table widget with api name validation test
    cy.GlobalSearchEntity("Table1");
    cy.CheckAndUnfoldEntityItem("Queries/JS");
    cy.RenameEntity(apiName);
    cy.validateMessage(apiName);
  });
});
