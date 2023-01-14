const dsl = require("../../../../../../fixtures/Listv2/simpleLargeListv2.json");
const publish = require("../../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../../locators/commonlocators.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const widgetSelectorByType = (name) => `.t--widget-${name}`;

// TODO: Test for Reset functionality
const items = JSON.parse(dsl.dsl.children[0].listData);

describe("Input Widgets", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("a. Input Widgets default value", function() {
    cy.dragAndDropToWidget("currencyinputwidget", "listwidgetv2", {
      x: 50,
      y: 50,
    });
    cy.dragAndDropToWidget("phoneinputwidget", "listwidgetv2", {
      x: 50,
      y: 120,
    });

    cy.dragAndDropToWidget("inputwidgetv2", "listwidgetv2", {
      x: 50,
      y: 200,
    });
    cy.openPropertyPane("currencyinputwidget");
    cy.updateCodeInput(
      ".t--property-control-defaultvalue",
      `{{currentItem.id}}`,
    );
    cy.togglebar(commonlocators.requiredCheckbox);

    cy.openPropertyPane("phoneinputwidget");
    cy.updateCodeInput(
      ".t--property-control-defaultvalue",
      `{{currentItem.phoneNumber}}`,
    );
    cy.togglebar(commonlocators.requiredCheckbox);
    cy.togglebarDisable(commonlocators.EnableFormatting);

    cy.openPropertyPane("inputwidgetv2");
    cy.updateCodeInput(
      ".t--property-control-defaultvalue",
      `{{currentItem.email}}`,
    );
    cy.togglebar(commonlocators.requiredCheckbox);

    cy.get(publish.inputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", items[0].email);
    cy.get(widgetsPage.currencyInputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", items[0].id);
    cy.get(widgetsPage.phoneInputWidget + " " + "input")
      .invoke("attr", "value")
      .should("contain", items[0].phoneNumber);
  });
  it("b. Input Widgets isValid", function() {
    // Test for isValid === True
    cy.dragAndDropToWidget("textwidget", "listwidgetv2", {
      x: 350,
      y: 50,
    });

    cy.RenameWidgetFromPropertyPane("textwidget", "Text1", "Input_Widget");
    cy.testJsontext("text", `{{currentView.Input1.isValid}}`);
    cy.get(`${widgetSelector("Input_Widget")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", "true");

    cy.dragAndDropToWidget("textwidget", "listwidgetv2", {
      x: 350,
      y: 120,
    });

    cy.RenameWidgetFromPropertyPane("textwidget", "Text1", "Currency_Widget");

    cy.testJsontext("text", `{{currentView.CurrencyInput1.isValid}}`);
    cy.get(
      `${widgetSelector("Currency_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", "true");

    cy.dragAndDropToWidget("textwidget", "listwidgetv2", {
      x: 350,
      y: 210,
    });

    cy.RenameWidgetFromPropertyPane("textwidget", "Text1", "PhoneInput_Widget");
    cy.testJsontext("text", `{{currentView.PhoneInput1.isValid}}`);
    cy.get(
      `${widgetSelector("PhoneInput_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", "true");

    // Test for isValid === false
    cy.get(`${widgetSelectorByType("inputwidgetv2")} input`).clear({
      force: true,
    });
    cy.get(`${widgetSelector("Input_Widget")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", "false");

    cy.get(`${widgetSelectorByType("phoneinputwidget")} input`).clear({
      force: true,
    });
    cy.get(
      `${widgetSelector("PhoneInput_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", "false");

    cy.get(`${widgetSelectorByType("currencyinputwidget")} input`).clear({
      force: true,
    });
    cy.get(
      `${widgetSelector("Currency_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", "false");
  });
});
