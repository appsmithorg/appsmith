import * as _ from "../../../../../support/Objects/ObjectsCore";

const widgetName = "currencyinputwidget";
const widgetInput = `.t--widget-${widgetName} input`;
describe(
  "Currency widget - ",
  { tags: ["@tag.Widget", "@tag.CurrencyInput"] },
  () => {
    before(() => {
      _.agHelper.AddDsl("emptyDSL");
      cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    });

    it("Should differentiate between Indian numeral system and International numeral system in Currency Input Widget", () => {
      cy.openPropertyPane(widgetName);
      const valueToType = "1000000";
      cy.get(_.locators._input).type(valueToType);
      cy.get(".t--property-control-currency").click();
      cy.get(widgetInput).should('have.value', '10,00,000');
      cy.get(".t--property-control-currency").type("usd");
      cy.selectDropdownValue(
        ".t--property-control-currency input",
        "USD - US Dollar",
      );
      cy.get(widgetInput).clear();
      cy.get(_.locators._input).type(valueToType);
      cy.scrollTo('top', { ensureScrollable: false });
      cy.get(".t--property-control-currency").click();
      cy.get(widgetInput).should('have.value', '1,000,000');
    });
  },
);