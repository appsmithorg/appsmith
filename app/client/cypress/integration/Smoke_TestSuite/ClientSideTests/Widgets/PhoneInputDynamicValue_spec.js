const dynamicDSL = require("../../../../fixtures/PhoneInputDynamic.json");

const widgetName = "phoneinputwidget";

describe("Phone input widget - ", () => {
  before(() => {
    cy.addDsl(dynamicDSL);
  });

  it("should check that widget can be used with dynamic default dial code", () => {
    cy.openPropertyPane(widgetName);
    cy.get(".t--property-control-defaultcountrycode .CodeMirror-code").should(
      "contain",
      "{{appsmith.store.test}}",
    );
    cy.get(".t--property-control-allowcountrycodechange label")
      .last()
      .click({ force: true });
    cy.get(".t--input-country-code-change")
      .first()
      .click();
    cy.get(".t--search-input input").type("india");
    cy.wait(500);
    cy.get(".t--dropdown-option")
      .last()
      .click();
    cy.get(".t--property-control-defaultcountrycode .CodeMirror-code").should(
      "contain",
      "{{appsmith.store.test}}",
    );
    cy.PublishtheApp();
    cy.get(".bp3-button.select-button").click({ force: true });
    cy.get(".menu-item-text")
      .first()
      .click({ force: true });
    cy.get(".t--input-country-code-change").should("contain", "+91");
    cy.get(".t--widget-textwidget").should("contain", "+91:IN:+91");
    cy.get(".bp3-button.select-button").click({ force: true });
    cy.get(".menu-item-text")
      .last()
      .click({ force: true });
    cy.get(".t--input-country-code-change").should("contain", "+93");
    cy.get(".t--widget-textwidget").should("contain", "+93:AF:+93");
  });
});
