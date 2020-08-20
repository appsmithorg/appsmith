const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");
const widgetsPage = require("../../../locators/Widgets.json");
const testdata = require("../../../fixtures/testdata.json");
const pages = require("../../../locators/Pages.json");
const apiwidget = require("../../../locators/apiWidgetslocator.json");
const explorer = require("../../../locators/explorerlocators.json");
const pageid = "MyPage";

describe("Entity explorer tests related to widgets and validation", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Widget edit/delete/copy to clipboard validation", function() {
    cy.openPropertyPane("textwidget");
    cy.widgetText("Api", widgetsPage.textWidget, widgetsPage.textInputval);
    cy.testCodeMirror("/api/users/2");
    cy.NavigateToEntityExplorer();
    cy.wait(5000);
    cy.SearchEntityandOpen("Api");
    cy.get(explorer.collapse)
      .last()
      .click({ force: true });
    cy.get(explorer.property)
      .last()
      .click({ force: true });
    cy.wait(2000);
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{Api.isVisible}}");
      expect($lis.eq(1)).to.contain("{{Api.text}}");
    });
    cy.GlobalSearchEntity("Api");
    cy.EditApiNameFromExplorer("ApiUpdated");
    cy.GlobalSearchEntity("ApiUpdated");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{ApiUpdated.isVisible}}");
      expect($lis.eq(1)).to.contain("{{ApiUpdated.text}}");
    });
    cy.DeleteWidgetFromSideBar();
  });
});
