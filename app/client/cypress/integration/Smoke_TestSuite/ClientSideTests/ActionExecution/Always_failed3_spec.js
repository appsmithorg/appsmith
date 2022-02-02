const homePage = require("../../../locators/HomePage.json");
const dsl = require("../../../fixtures/PgAdmindsl.json");
const datasource = require("../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../locators/QueryEditor.json");
const widgetsPage = require("../../../locators/Widgets.json");
const appPage = require("../../../locators/PgAdminlocators.json");

describe("Always fail3", function() {
  let orgid;
  let newOrganizationName;
  let appname;
  let datasourceName;

  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Always fail", function() {
    
    cy.contains("Check contentns").should('Check contentns');


  });

});
