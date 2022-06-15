const testdata = require("../../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  locator = ObjectsRegistry.CommonLocators;

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
      .wait(1000);
    agHelper.AssertElementAbsence(locator._toastMsg); //verifying there is no error toast, Bug 14566
    cy.saveDatasource();
    cy.contains(".datasource-highlight", "https://mock-api.appsmith.com");
    cy.SaveAndRunAPI();
  });
});
