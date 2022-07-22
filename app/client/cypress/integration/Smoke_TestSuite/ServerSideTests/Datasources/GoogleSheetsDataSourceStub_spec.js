const datasource = require("../../../../locators/DatasourcesEditor.json");

describe("Google Sheets datasource test cases", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create Google Sheets datasource", function() {
    cy.NavigateToDatasourceEditor();
    cy.get(datasource.googleSheets).click();
    cy.get(datasource.scopeString).click();
    cy.get(datasource.GS_readFiles).should("exist");
    cy.get(datasource.GS_readAndEditFiles).should("exist");
    cy.get(datasource.GS_readEditCreateAndDeleteFiles).should("exist");
  });
});
