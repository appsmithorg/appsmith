import { WIDGET, getWidgetSelector } from "../../../../locators/WidgetLocators";
import publishLocators from "../../../../locators/publishWidgetspage.json";
import widgetLocators from "../../../../locators/Widgets.json";
import commonlocators from "../../../../locators/commonlocators.json";
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("JSObject testing", () => {
  before(() => {
    _.homePage.NavigateToHome();
    _.homePage.ImportApp("JSObjectMutationTestApp.json");
    _.homePage.AssertImportToast();
  });

  it("1. Number increment and decrement", function () {
    _.agHelper.ClickButton("ADD");
    _.agHelper.ClickButton("ADD");
    _.agHelper.ClickButton("ADD");
    _.agHelper
      .GetText(`${getWidgetSelector(WIDGET.TEXT)} span`)
      .then(($label) => {
        expect($label).to.equal("4");
      });

    _.agHelper.Sleep(400);
    _.agHelper.ClickButton("SUB");
    _.agHelper.ClickButton("SUB");
    _.agHelper
      .GetText(`${getWidgetSelector(WIDGET.TEXT)} span`)
      .then(($label) => {
        expect($label).to.equal("2");
      });
  });

  it("2. Array push and pop", function () {
    // open the select widget
    cy.get(publishLocators.selectwidget)
      .eq(0)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });

    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("ARRAY")
      .click({ force: true });

    _.agHelper.ClickButton("ADD");
    _.agHelper.ClickButton("ADD");
    _.agHelper.ClickButton("ADD");

    _.agHelper
      .GetText(`${getWidgetSelector(WIDGET.TEXT)} span`)
      .then(($label) => {
        expect($label).contains("[  0,  1,  2]");
      });
  });

  it("3. Object property addition and deletion", function () {
    cy.get(publishLocators.selectwidget)
      .eq(0)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });

    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("OBJECT")
      .click({ force: true });

    _.agHelper.ClickButton("ADD");
    _.agHelper
      .GetText(`${getWidgetSelector(WIDGET.TEXT)} span`)
      .then(($label) => {
        expect($label).contains('{  "a": {    "b": 1  }}');
      });
  });

  it("4. Map property addition and deletion", function () {
    cy.get(publishLocators.selectwidget)
      .eq(0)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });

    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("MAP")
      .click({ force: true });

    _.agHelper.ClickButton("ADD");
    _.agHelper
      .GetText(`${getWidgetSelector(WIDGET.TEXT)} span`)
      .then(($label) => {
        expect($label).contains('[  [    "a",    1  ]]');
      });

    _.agHelper.ClickButton("SUB");
    _.agHelper
      .GetText(`${getWidgetSelector(WIDGET.TEXT)} span`)
      .then(($label) => {
        expect($label).contains("[]");
      });
  });

  it("5. Set property addition and deletion", function () {
    cy.get(publishLocators.selectwidget)
      .eq(0)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });

    cy.get(commonlocators.singleSelectWidgetMenuItem)
      .contains("SET")
      .click({ force: true });

    _.agHelper.ClickButton("ADD");
    _.agHelper
      .GetText(`${getWidgetSelector(WIDGET.TEXT)} span`)
      .then(($label) => {
        expect($label).contains("[  0]");
      });

    _.agHelper.ClickButton("SUB");
    _.agHelper
      .GetText(`${getWidgetSelector(WIDGET.TEXT)} span`)
      .then(($label) => {
        expect($label).contains("[]");
      });
  });
});
