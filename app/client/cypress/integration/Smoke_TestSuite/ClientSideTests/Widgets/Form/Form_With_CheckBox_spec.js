const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/formWidgetdsl.json");

describe("Checkbox Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Checkbox Functionality To Check required toggle for form", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.togglebar(commonlocators.requiredjs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget).click();
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .should("have.class", "bp3-disabled");

    cy.get(publish.checkboxWidget).click();
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .should("not.have.attr", "disabled");

    cy.get(publish.backToEditor).click();
  });
  it("Checkbox Functionality To swap label alignment of checkbox", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.get(publish.checkboxWidget + " " + ".bp3-align-right").should(
      "not.exist",
    );
    cy.get(publish.checkboxWidget + " " + ".bp3-align-left").should("exist");
    // align right
    cy.get(".t--property-control-alignment .t--button-tab-RIGHT")
      .first()
      .click();
    cy.wait(200);
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + ".bp3-align-right").should("exist");
    cy.get(publish.checkboxWidget + " " + ".bp3-align-left").should(
      "not.exist",
    );
    cy.get(publish.backToEditor).click();
  });

  it("Checkbox Functionality To swap label position of checkbox", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
      "have.css",
      "text-align",
      "right",
    );
    cy.get(commonlocators.optionposition)
      .last()
      .click({ force: true });
    cy.wait(200);
    cy.get(commonlocators.dropdownmenu)
      .contains("Left")
      .click({ force: true });
    cy.wait(200);
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
      "have.css",
      "text-align",
      "left",
    );
    cy.get(publish.backToEditor).click();
  });

  it("Checkbox Functionality To change label color of checkbox", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.get(".t--property-control-textcolor .bp3-input").type("red");
    cy.wait(200);
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
      "have.css",
      "color",
      "rgb(255, 0, 0)",
    );
    cy.get(publish.backToEditor).click();
  });

  it("Checkbox Functionality To change label size of checkbox", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.get(widgetsPage.textSize)
      .last()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.selectTxtSize("XL");
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
      "have.css",
      "font-size",
      "30px",
    );
    cy.get(publish.backToEditor).click();
  });

  it("Checkbox Functionality To change label style of checkbox", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.get(".t--property-control-labelfontstyle .t--button-tab-BOLD").click({
      force: true,
    });
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + ".t--checkbox-widget-label").should(
      "have.css",
      "font-weight",
      "700",
    );
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
