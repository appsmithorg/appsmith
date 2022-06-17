const testdata = require("../../../../fixtures/testdata.json");

describe("Create a rest datasource", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a rest datasource", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("Testapi");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.assertPageSave();
    cy.get(".t--store-as-datasource")
      .trigger("click")
      .wait(500);
    cy.saveDatasource();
    cy.contains(".datasource-highlight", "https://mock-api.appsmith.com");
    cy.SaveAndRunAPI();
  });
});
