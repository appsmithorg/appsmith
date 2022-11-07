const widgetsPage = require("../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

const agHelper = ObjectsRegistry.AggregateHelper;

describe("DatePicker Widget Property tests onFocus and onBlur", function() {
  it("onBlur and onFocus should be triggerd from the datePicker widget", () => {
    cy.dragAndDropToCanvas("datepickerwidget2", { x: 300, y: 600 });
    cy.openPropertyPane("datepickerwidget2");

    cy.get(widgetsPage.toggleOnFocus).click({ force: true });
    cy.testJsontext("onfocus", "{{showAlert('Focused','success')}}");
    cy.get(widgetsPage.toggleOnBlur).click({ force: true });
    cy.testJsontext("onblur", "{{showAlert('Blurred','success')}}");

    cy.get(widgetsPage.datepickerInput).click({ force: true });
    cy.validateToastMessage("Focused");
    cy.wait(5000);
    agHelper.PressEscape();
    cy.validateToastMessage("Blurred");
  });
});
