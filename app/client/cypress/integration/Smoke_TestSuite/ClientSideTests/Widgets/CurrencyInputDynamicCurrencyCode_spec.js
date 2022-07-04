const dynamicDSL = require("../../../../fixtures/CurrencyInputDynamic.json");

const widgetName = "currencyinputwidget";
const widgetInput = `.t--widget-${widgetName} input`;

describe("Currency input widget - ", () => {
  before(() => {
    cy.addDsl(dynamicDSL);
  });

  it("should check that widget can be used with dynamic default currency code", () => {
    cy.openPropertyPane(widgetName);
    cy.get(".t--property-control-currency .CodeMirror-code").should(
      "contain",
      "{{appsmith.store.test}}",
    );
    cy.get(".t--property-control-allowcurrencychange label")
      .last()
      .click({ force: true });
    cy.get(".t--input-currency-change")
      .first()
      .click();
    cy.get(".t--search-input input").type("gbp");
    cy.wait(500);
    cy.get(".t--dropdown-option")
      .last()
      .click();
    cy.get(".t--property-control-currency .CodeMirror-code").should(
      "contain",
      "{{appsmith.store.test}}",
    );
    cy.PublishtheApp();
    cy.get(".bp3-button.select-button").click({ force: true });
    cy.get(".menu-item-text")
      .first()
      .click({ force: true });
    cy.get(".t--widget-textwidget").should("contain", "USD:AS:USD");
    cy.get(".t--input-currency-change").should("contain", "$");
    cy.get(".bp3-button.select-button").click({ force: true });
    cy.get(".menu-item-text")
      .last()
      .click({ force: true });
    cy.get(".t--widget-textwidget").should("contain", "INR:IN:INR");
    cy.get(".t--input-currency-change").should("contain", "₹");
  });
});
