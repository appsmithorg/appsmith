const dsl = require("../../../../fixtures/basicTabledsl.json");

describe("Tab widget test", function() {
  const apiName = "Table1";
  const tableName = "Table";
  before(() => {
    cy.addDsl(dsl);
  });

  it("Rename API with table widget name validation test", function() {
    cy.log("Login Successful");
    cy.NavigateToAPI_Panel();
    cy.log("Navigation to API Panel screen successful");
    cy.CreateApiAndValidateUniqueEntityName(apiName);
  });

  it("Rename Table widget with api name validation test", function() {
    cy.GlobalSearchEntity("Table1");
    cy.RenameEntity(tableName);
    cy.validateMessage(tableName);
  });
});
