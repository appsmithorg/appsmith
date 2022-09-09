const dynamicDSL = require("../../../../../fixtures/PhoneInputDynamic.json");
const publish = require("../../../../../locators/publishWidgetspage.json");

const widgetName = "phoneinputwidget";

describe("Phone input widget - ", () => {
  before(() => {
    cy.addDsl(dynamicDSL);
  });

  it("1. Should show empty dropdown for a typo", () => {
    cy.openPropertyPane(widgetName);

    // Turn on allowCountryCodeChange
    cy.get(".t--property-control-allowcountrycodechange label")
      .last()
      .click({ force: true });
    // Click on the country code change option
    cy.get(".t--input-country-code-change")
      .first()
      .click();
    // Search with a typo
    cy.get(".t--search-input input").type("inpia");
    cy.wait(500);
    // Assert the options dropdown is still open
    cy.get(".t--search-input input").should("be.visible");

    cy.PublishtheApp();
    // Click on the country code change option
    cy.get(".t--input-country-code-change")
      .first()
      .click();
    // Search with a typo
    cy.get(".t--search-input input").type("inpia");
    cy.wait(500);
    // Assert the options dropdown is still open
    cy.get(".t--search-input input").should("be.visible");
    cy.get(publish.backToEditor).click();
  });

  it("2. should check that widget can be used with dynamic default dial code", () => {
    cy.openPropertyPane(widgetName);
    cy.get(".t--property-control-defaultcountrycode .CodeMirror-code").should(
      "contain",
      "{{appsmith.store.test}}",
    );
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
