const testdata = require("../../../../fixtures/testdata.json");
const apiwidget = require("../../../../locators/apiWidgetslocator.json");
const explorer = require("../../../../locators/explorerlocators.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/formWidgetdsl.json");

const pageid = "MyPage";

before(() => {
  cy.addDsl(dsl);
});

describe("Test Suite to validate copy/delete/undo functionalites", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

  it("Drag and drop form widget and validate copy widget via toast message", function() {
    cy.openPropertyPane("formwidget");
    cy.widgetText(
      "FormTest",
      formWidgetsPage.formWidget,
      formWidgetsPage.formInner,
    );
    cy.get(commonlocators.copyWidget).click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(commonlocators.toastBody)
      .first()
      .contains("Copied");
  });

  it("Delete Widget from sidebar and Undo action validation", function() {
    cy.GlobalSearchEntity("WIDGETS");
    cy.get(".t--entity-name")
      .contains("FormTest")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(1);
    cy.selectAction("Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{FormTest.isVisible}}");
      expect($lis.eq(1)).to.contain("{{FormTest.data}}");
    });
    cy.get(".t--entity-name")
      .contains("FormTest")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(1);
    cy.selectAction("Delete");
    //cy.DeleteWidgetFromSideBar();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(apiwidget.propertyList).should("not.exist");
    /*
    To be enabled once widget delete click works
    cy.get('.t--delete-widget')
      .trigger("mouseover")
      .click({ force: true });
      */
    cy.get("body").type(`{${modifierKey}}z`);
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get(".t--entity-name")
      .contains("FormTest")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(1);
    cy.selectAction("Show Bindings");
    cy.get(apiwidget.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{FormTest.isVisible}}");
      expect($lis.eq(1)).to.contain("{{FormTest.data}}");
    });
  });
});
