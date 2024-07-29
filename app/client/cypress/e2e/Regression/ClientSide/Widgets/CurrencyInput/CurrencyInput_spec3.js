import {
    agHelper,
    locators,
    propPane,
} from "../../../../../support/Objects/ObjectsCore";
const widgetName = "currencyinputwidget";
describe(
  "Currency widget - ",
  { tags: ["@tag.Widget", "@tag.CurrencyInput"] },
  () => {
    before(() => {
      agHelper.AddDsl("emptyDSL");
      cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    });

 
    it("should reflect the value in currency input field while changing the decimals allowed input", () => {
      cy.openPropertyPane(widgetName);
      cy.selectDropdownValue(".t--property-control-decimalsallowed input", "4");

      const valueToType = "100.3654";
      cy.get(locators._input).type(valueToType);
      cy.selectDropdownValue(".t--property-control-decimalsallowed input", "3");
      cy.wait(1000); 
      cy.selectDropdownValue(".t--property-control-decimalsallowed input", "1");
      cy.wait(1000); 
      cy.selectDropdownValue(".t--property-control-decimalsallowed input", "0");
    });
  },
);
  