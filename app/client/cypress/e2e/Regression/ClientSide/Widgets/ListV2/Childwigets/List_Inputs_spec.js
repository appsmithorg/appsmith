const dsl = require("../../../../../../fixtures/Listv2/simpleLargeListv2.json");
const dslWithCurrencyWidget = require("../../../../../../fixtures/Listv2/simpleListWithCurrencyWidget.json");
const publish = require("../../../../../../locators/publishWidgetspage.json");
const widgetsPage = require("../../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../../locators/commonlocators.json");

import * as _ from "../../../../../../support/Objects/ObjectsCore";

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
const widgetSelectorByType = (name) => `.t--widget-${name}`;

// TODO: Test for Reset functionality
const items = JSON.parse(dsl.dsl.children[0].listData);

describe("Input Widgets", function () {
  before(() => {
    _.agHelper.AddDsl("Listv2/simpleLargeListv2");
  });

  beforeEach(() => {
    _.agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    _.agHelper.SaveLocalStorageCache();
  });

  it("1. Input Widgets default value", function () {
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.CURRENCY_INPUT,
      300,
      100,
    );
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.PHONEINPUT,
      300,
      200,
    );
    _.entityExplorer.DragDropWidgetNVerify(
      _.draggableWidgets.INPUT_V2,
      300,
      300,
    );
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
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 600, 300);
    cy.RenameWidgetFromPropertyPane("textwidget", "Text1", "Input_Widget");
    cy.wait(1000);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "{{currentView.Input1.isValid}}",
    );
    cy.get(`${widgetSelector("Input_Widget")} ${commonlocators.bodyTextStyle}`)
      .first()
      .should("have.text", "true");

    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 600, 100);
    cy.RenameWidgetFromPropertyPane("textwidget", "Text1", "Currency_Widget");
    cy.wait(1000);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "{{currentView.CurrencyInput1.isValid}}",
    );
    cy.get(
      `${widgetSelector("Currency_Widget")} ${commonlocators.bodyTextStyle}`,
    )
      .first()
      .should("have.text", "true");

    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.TEXT, 600, 200);

    cy.RenameWidgetFromPropertyPane("textwidget", "Text1", "PhoneInput_Widget");
    cy.wait(1000);
    _.propPane.UpdatePropertyFieldValue(
      "Text",
      "{{currentView.PhoneInput1.isValid}}",
    );
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
