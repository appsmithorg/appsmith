const dsl = require("../../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const themelocators = require("../../../../../locators/ThemeLocators.json");

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
      //[input, {{CurrencyInput1.text}}:{{CurrencyInput1.value}}:{{CurrencyInput1.isValid}}:{{typeof CurrencyInput1.text}}:{{typeof CurrencyInput1.value}}:{{CurrencyInput1.countryCode}}:{{CurrencyInput1.currencyCode}}]
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
      //[input, {{CurrencyInput1.text}}:{{CurrencyInput1.value}}:{{CurrencyInput1.isValid}}:{{typeof CurrencyInput1.text}}:{{typeof CurrencyInput1.value}}:{{CurrencyInput1.countryCode}}:{{CurrencyInput1.currencyCode}}]
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
      //[input, {{CurrencyInput1.text}}:{{CurrencyInput1.value}}:{{CurrencyInput1.isValid}}:{{typeof CurrencyInput1.text}}:{{typeof CurrencyInput1.value}}:{{CurrencyInput1.countryCode}}:{{CurrencyInput1.currencyCode}}]
      ["100", "100:100:true:string:number:AS:USD"],
      ["1000", "1,000:1000:true:string:number:AS:USD"],
      ["100.22", "100.22:100.22:true:string:number:AS:USD"],
      ["1000.22", "1,000.22:1000.22:true:string:number:AS:USD"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });
    cy.get(".currency-change-dropdown-trigger").should("contain", "$");

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(
      ".t--property-control-currency",
      "INR - Indian Rupee",
    );
    enterAndTest("100.22", "100.22:100.22:true:string:number:IN:INR");
    cy.get(".currency-change-dropdown-trigger").should("contain", "₹");

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

  it("should check that widget input doesn't round off values", () => {
    function enterAndTest(text, expected) {
      cy.get(widgetInput).clear();
      cy.wait(300);
      if (text) {
        cy.get(widgetInput).type(text);
      }
      cy.openPropertyPane("textwidget");
      cy.get(".t--widget-textwidget").should("contain", expected);
    }
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{CurrencyInput1.text}}:{{CurrencyInput1.value}}`,
    );
    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-decimals", "0");

    [
      //[input, {{CurrencyInput1.text}}:{{CurrencyInput1.value}}]
      ["100", "100:100"],
      ["1000", "1,000:1000"],
      ["100.22", "10,022:10022"],
      ["1000.22", "100,022:100022"],
      ["1000.20", "100,020:100020"],
      ["1000.90", "100,090:100090"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-decimals", "1");
    [
      //[input, {{CurrencyInput1.text}}:{{CurrencyInput1.value}}]
      ["100", "100:100"],
      ["1000", "1,000:1000"],
      ["100.22", "100.2:100.2"],
      ["1000.20", "1,000.2:1000.2"],
      ["1000.99", "1,000.9:1000.9"],
      ["1000.90", "1,000.9:1000.9"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-decimals", "2");
    [
      //[input, {{CurrencyInput1.text}}:{{CurrencyInput1.value}}]
      ["100", "100:100"],
      ["1000", "1,000:1000"],
      ["100.2", "100.20:100.2"],
      ["1000.20", "1,000.20:1000.2"],
      ["1000.21", "1,000.21:1000.21"],
      ["1000.9", "1,000.90:1000.9"],
      ["1000.90", "1,000.90:1000.9"],
      ["1000.99", "1,000.99:1000.99"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });

    cy.get(widgetInput).clear();
    cy.wait(300);
    cy.get(widgetInput).type("1000.90");
    cy.openPropertyPane("textwidget");
    cy.get(widgetInput).should("contain.value", "1,000.90");
    cy.get(widgetInput).focus({ force: true });
    cy.get(widgetInput).should("contain.value", "1000.90");
    cy.openPropertyPane("textwidget");
    cy.get(widgetInput).should("contain.value", "1,000.90");
  });

  it("should test the formatting of defaultText", () => {
    function enterAndTest(input, expected) {
      cy.updateCodeInput(".t--property-control-defaulttext", input);
      cy.wait(500);
      cy.get(widgetInput).should("contain.value", expected);
    }

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-decimals", "0");

    [
      //[input, expected]
      ["100", "100"],
      ["1000", "1,000"],
      ["1000.1", "1,000"],
      ["1000.9", "1,001"],
      ["100.22", "100"],
      ["1000.20", "1,000"],
      ["1000.90", "1,001"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-decimals", "1");
    [
      //[input, expected]
      ["100", "100"],
      ["1000", "1,000"],
      ["1000.1", "1,000.1"],
      ["1000.9", "1,000.9"],
      ["100.22", "100.2"],
      ["1000.20", "1,000.2"],
      ["1000.90", "1,000.9"],
      ["1000.79", "1,000.8"],
      ["1000.19", "1,000.2"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });

    cy.openPropertyPane(widgetName);
    cy.selectDropdownValue(".t--property-control-decimals", "2");
    [
      //[input, expected]
      ["100", "100"],
      ["1000", "1,000"],
      ["1000.1", "1,000.10"],
      ["1000.9", "1,000.90"],
      ["100.22", "100.22"],
      ["1000.20", "1,000.20"],
      ["1000.90", "1,000.90"],
      ["1000.79", "1,000.79"],
      ["1000.19", "1,000.19"],
      ["1000.191", "1,000.19"],
      ["1000.199", "1,000.20"],
      ["1000.911", "1,000.91"],
      ["1000.919", "1,000.92"],
      ["1000.999", "1,001"],
    ].forEach((d) => {
      enterAndTest(d[0], d[1]);
    });
  });

  it("Check isDirty meta property", function() {
    cy.openPropertyPane("textwidget");
    cy.updateCodeInput(
      ".t--property-control-text",
      `{{CurrencyInput1.isDirty}}`,
    );
    // Init isDirty
    cy.openPropertyPane(widgetName);
    cy.updateCodeInput(".t--property-control-defaulttext", "1");
    cy.closePropertyPane();
    // Check if initial value of isDirty is false
    cy.get(".t--widget-textwidget").should("contain", "false");
    // Interact with UI
    cy.get(widgetInput).clear();
    cy.wait(300);
    // Check if isDirty is set to true
    cy.get(".t--widget-textwidget").should("contain", "true");
    // Change defaultText
    cy.openPropertyPane(widgetName);
    cy.updateCodeInput(".t--property-control-defaulttext", "5");
    // Check if isDirty is reset to false
    cy.get(".t--widget-textwidget").should("contain", "false");
  });

  it("Should check that widget input is not showing any errors on input", function() {
    cy.get(widgetInput).type("123456789");
    cy.focused().then(() => {
      cy.get(themelocators.popover).should("not.exist");
    });
  });
});
