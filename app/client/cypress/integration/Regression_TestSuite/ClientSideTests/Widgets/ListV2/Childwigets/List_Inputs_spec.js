const dsl = require("../../../../../../fixtures/Listv2/simpleLargeListv2.json");
const dslWithCurrencyWidget = require("../../../../../../fixtures/Listv2/simpleListWithCurrencyWidget.json");
const publish = require("../../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../../locators/commonlocators.json");

import { ObjectsRegistry } from "../../../../../../support/Objects/Registry";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const widgetSelectorByType = (name) => `.t--widget-${name}`;

let agHelper = ObjectsRegistry.AggregateHelper;

// TODO: Test for Reset functionality
const items = JSON.parse(dsl.dsl.children[0].listData);

describe("Input Widgets", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  it("1. Input Widgets default value", function () {
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

  it("2. Input Widgets isValid", function () {
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

  it("3. Currency widget default value is retained over page change", () => {
    const value = "123456789";
    const formattedText = "123,456,789";

    cy.addDsl(dslWithCurrencyWidget);
    cy.openPropertyPane("currencyinputwidget");
    cy.updateCodeInput(".t--property-control-defaultvalue", value);

    // Observe the value of 2nd item currency widget - formatted text
    cy.get(".t--widget-currencyinputwidget")
      .eq(1)
      .find("input")
      .should("have.value", formattedText);

    // Find the 2nd item currency and click to focus
    cy.get(".t--widget-currencyinputwidget")
      .eq(1)
      .find("input")
      .click({ force: true });

    // Observe the value of 2nd item currency widget - un-formatted text
    cy.get(".t--widget-currencyinputwidget")
      .eq(1)
      .find("input")
      .should("have.value", value);

    // Change to page 2
    cy.get(".rc-pagination-item")
      .find("a")
      .contains("2")
      .click({ force: true })
      .wait(500);

    // Back to page 1
    cy.get(".rc-pagination-item")
      .find("a")
      .contains("1")
      .click({ force: true })
      .wait(500);

    // Observe the value of 2nd item currency widget - formatted text
    cy.get(".t--widget-currencyinputwidget")
      .eq(1)
      .find("input")
      .should("have.value", formattedText);
  });
});
