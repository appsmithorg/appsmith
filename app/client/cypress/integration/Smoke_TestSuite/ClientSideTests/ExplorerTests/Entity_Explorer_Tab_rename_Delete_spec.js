const commonlocators = require("../../../../locators/commonlocators.json");
const Layoutpage = require("../../../../locators/Layout.json");
const explorer = require("../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tabdsl.json");
const pages = require("../../../../locators/Pages.json");
const tabname = "UpdatedTab";

describe("Tab widget test", function() {
  const tabname = "UpdatedTab";
  before(() => {
    cy.addDsl(dsl);
  });

  it("Tab Widget Functionality To rename Tabs from entity explorer", function() {
    cy.GlobalSearchEntity("Tab1");
    cy.hoverAndClickParticularIndex(2);
    cy.selectAction("Edit Name");
    //cy.RenameEntity(tabname);
    cy.get(explorer.editEntity)
      .last()
      .type(tabname, { force: true });
    //cy.RenameEntity(tabname);
  });

  it("Tab name validation in properties and widget ", function() {
    cy.openPropertyPane("tabswidget");
    cy.closePropertyPane();
    cy.get(Layoutpage.tabWidget)
      .contains(tabname)
      .click({ force: true })
      .should("be.visible");
  });

  it("Tab Widget Functionality To delete Tabs from entity explorer", function() {
    cy.GlobalSearchEntity("Tab2");
    cy.hoverAndClickParticularIndex(3);
    cy.selectAction("Edit Name");
    //cy.RenameEntity(tabname);
    cy.get(explorer.editEntity)
      .last()
      .type(tabname, { force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(3000);
    cy.validateMessage(tabname);
    cy.deleteEntityWithoutConfirmation();
    cy.get(commonlocators.entityExplorersearch)
      .clear({ force: true })
      .type("Tab2", { force: true });
    cy.get(
      commonlocators.entitySearchResult.concat("Tab2").concat("')"),
    ).should("not.exist");
  });

  /* To be enabled once the bug is fixed
    it("Publish app and check for the widget name", function() {
      cy.PublishtheApp();
      cy.get(publish.tabWidget)
        .contains(tabname)
        .click({ force: true })
        .should("be.selected");
      cy.get(publish.tabWidget)
        .contains("Tab 2")
        .click({ force: true })
        .should("be.selected");
    });

    it("Tab Widget Functionality To Unchecked Visible Widget", function() {
      cy.get(publish.backToEditor).first().click();
      cy.openPropertyPane("tabswidget");
      cy.closePropertyPane();
      cy.get(Layoutpage.tabWidget)
        .contains("Tab 2")
        .click({ force: true })
        .should("not.be.visible");
    });
    */
});

afterEach(() => {
  // put your clean up code if any
});
