const commonlocators = require("../../../locators/commonlocators.json");
const Layoutpage = require("../../../locators/Layout.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/tabdsl.json");
const pages = require("../../../locators/Pages.json");

describe("Tab widget test", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Tab Widget Functionality To rename Tabs from entity explorer", function() {
    cy.GlobalSearchEntity("Tab 1");
    cy.RenameEntity("UpdatedTab");
  });

  it("Tab Widget Functionality To delete Tabs from entity explorer", function() {
    cy.GlobalSearchEntity("Tab 2");
    cy.deleteEntity();
  });
});
afterEach(() => {
  // put your clean up code if any
});
