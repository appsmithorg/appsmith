const widgetsPage = require("../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const inputWidgetName = "inputwidgetv2";
const widgetInput = widgetsPage.inputWidget + " " + "input";

const phoneInputWidgetName = "phoneinputwidget";
const phoneInputWidget = widgetsPage.phoneInputWidget + " " + "input";

const currencyInputWidgetName = "currencyinputwidget";
const currencyInputWidget = widgetsPage.currencyInputWidget + " " + "input";

const agHelper = ObjectsRegistry.AggregateHelper;

describe(
  "Input Widget Property tests onFocus and onBlur",
  { tags: ["@tag.Widget", "@tag.Input", "@tag.Binding"] },
  function () {
    it("1. onBlur and onFocus should be triggered from the input widget", () => {
      cy.dragAndDropToCanvas(inputWidgetName, { x: 300, y: 200 });
      cy.openPropertyPane(inputWidgetName);

      cy.get(widgetsPage.toggleOnFocus).click({ force: true });
      cy.testJsontext("onfocus", "{{showAlert('Focused','success')}}");
      cy.get(widgetsPage.toggleOnBlur).click({ force: true });
      cy.testJsontext("onblur", "{{showAlert('Blurred','success')}}");

      cy.get(widgetInput).click({ force: true });
      cy.validateToastMessage("Focused");
      agHelper.PressEscape();
      cy.openPropertyPane(inputWidgetName);
      cy.validateToastMessage("Blurred");
    });

    it("2. onBlur and onFocus should be triggered from the phone input widget", () => {
      cy.dragAndDropToCanvas(phoneInputWidgetName, { x: 300, y: 400 });
      cy.openPropertyPane(phoneInputWidgetName);

      cy.get(widgetsPage.toggleOnFocus).click({ force: true });
      cy.testJsontext("onfocus", "{{showAlert('Focused','success')}}");
      cy.get(widgetsPage.toggleOnBlur).click({ force: true });
      cy.testJsontext("onblur", "{{showAlert('Blurred','success')}}");

      cy.get(phoneInputWidget).click({ force: true });
      cy.validateToastMessage("Focused");
      agHelper.PressEscape();
      cy.openPropertyPane(phoneInputWidgetName);
      cy.validateToastMessage("Blurred");
    });

    it("3. onBlur and onFocus should be triggered from the currency input widget", () => {
      cy.dragAndDropToCanvas(currencyInputWidgetName, { x: 300, y: 600 });
      cy.openPropertyPane(currencyInputWidgetName);

      cy.get(widgetsPage.toggleOnFocus).click({ force: true });
      cy.testJsontext("onfocus", "{{showAlert('Focused','success')}}");
      cy.get(widgetsPage.toggleOnBlur).click({ force: true });
      cy.testJsontext("onblur", "{{showAlert('Blurred','success')}}");

      cy.get(currencyInputWidget).click({ force: true });
      cy.validateToastMessage("Focused");
      agHelper.PressEscape();
      cy.openPropertyPane(currencyInputWidgetName);
      cy.validateToastMessage("Blurred");
    });
  },
);
