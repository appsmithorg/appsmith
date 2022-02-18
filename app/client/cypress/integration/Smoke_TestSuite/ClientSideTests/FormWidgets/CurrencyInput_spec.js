const dsl = require("../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../locators/explorerlocators.json");

const widgetName = "currencyinputwidget";
const widgetInput = `.t--widget-${widgetName} input`;

describe("Currency widget - ", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add new dropdown widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas(widgetName, { x: 300, y: 300 });
    cy.get(`.t--widget-${widgetName}`).should("exist");
    cy.dragAndDropToCanvas("textwidget", { x: 300, y: 500 });
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{CurrencyInput1.text}}:{{CurrencyInput1.value}}:{{CurrencyInput1.isValid}}:{{typeof CurrencyInput1.text}}:{{typeof CurrencyInput1.value}}:{{CurrencyInput1.countryCode}}:{{CurrencyInput1.currencyCode}}`,
    );
  });

  it("should check for type of value and widget", () => {
    function enterAndTest(text, expected) {
      cy.get(widgetInput).clear();
      cy.wait(300);
      if (text) {
        cy.get(widgetInput).type(text);
      }
      cy.openPropertyPane("textwidget");
      cy.get(".t--widget-textwidget").should("contain", expected);
    }
    [
      ["100", "100:100:true:string:number:AS:USD"],
      ["1000", "1,000:1000:true:string:number:AS:USD"],
      ["100.22", "10,022:10022:true:string:number:AS:USD"],
      ["1000.22", "100,022:100022:true:string:number:AS:USD"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-decimals", "1");

    [
      ["100", "100:100:true:string:number:AS:USD"],
      ["1000", "1,000:1000:true:string:number:AS:USD"],
      ["100.22", "100.2:100.2:true:string:number:AS:USD"],
      ["1000.22", "1,000.2:1000.2:true:string:number:AS:USD"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-decimals", "2");

    [
      ["100", "100:100:true:string:number:AS:USD"],
      ["1000", "1,000:1000:true:string:number:AS:USD"],
      ["100.22", "100.22:100.22:true:string:number:AS:USD"],
      ["1000.22", "1,000.22:1000.22:true:string:number:AS:USD"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });
    cy.get(".currency-type-trigger").should("contain", "$");

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(
      ".t--property-control-currency",
      "INR - Indian Rupee",
    );
    enterAndTest("100.22", "100.22:100.22:true:string:number:IN:INR");
    cy.get(".currency-type-trigger").should("contain", "₹");

    cy.openPropertyPane(widgetName);
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
    enterAndTest("100.22", "100.22:100.22:true:string:number:GB:GBP");
    cy.get(".t--input-currency-change").should("contain", "£");
  });
  it("should accept 0 decimal option", () => {
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-decimals", "0");
    cy.closePropertyPane();
    cy.wait(500);
    cy.openPropertyPane(widgetName);
    cy.get(".t--property-control-decimals .cs-text").should("have.text", "0");
  });

  it("should check that widget input resets on submit", () => {
    cy.openPropertyPane(widgetName);
    cy.get(
      ".t--property-control-onsubmit .t--open-dropdown-Select-Action",
    ).click();
    cy.selectShowMsg();
    cy.addSuccessMessage("Submitted!!");

    cy.get(widgetInput).clear();
    cy.wait(300);
    cy.get(widgetInput).type("10000{enter}");
    cy.wait(300);
    cy.get(widgetInput).should("contain.value", "");
  });

  describe("Label section", () => {
    it("Check properties: Text, Position, Alignment, Width", () => {
      const labelText = "Name";
      const parentColumnSpace = 11.9375;
      const widgetSelector = `.t--widget-${widgetName}`;
      const labelSelector = `${widgetSelector} label`;
      const containerSelector = `${widgetSelector} [class*="InputComponentWrapper"]`;
      const labelPositionSelector = ".t--property-control-position button";
      const labelAlignmentSelector = ".t--property-control-alignment button";
      const labelWidthSelector =
        ".t--property-control-width .CodeMirror textarea";

      cy.openPropertyPane(widgetName);

      cy.get(".t--property-control-text .CodeMirror textarea")
        .first()
        .focus({ force: true })
        .type(labelText);
      // Assert label presence
      cy.get(labelSelector)
        .first()
        .contains(labelText);
      // Assert label position: Auto
      cy.get(containerSelector).should("have.css", "flex-direction", "row");
      // Change label position to Top
      cy.get(labelPositionSelector)
        .eq(1)
        .click({ force: true });
      // Assert label position: Top
      cy.get(containerSelector).should("have.css", "flex-direction", "column");
      // Change label position to Left
      cy.get(labelPositionSelector)
        .eq(2)
        .click({ force: true });
      cy.wait(300);
      // Set label alignment to RIGHT
      cy.get(labelAlignmentSelector)
        .eq(1)
        .click({ force: true });
      // Assert label alignment
      cy.get(labelSelector)
        .first()
        .should("have.css", "text-align", "right");
      // Set label width to 4 cols
      cy.get(labelWidthSelector)
        .first()
        .focus()
        .type("4");
      cy.wait(300);
      // Assert label width
      cy.get(labelSelector)
        .first()
        .should("have.css", "width", `${parentColumnSpace * 4}px`);
    });
  });
});
