const dsl = require("../../../../../fixtures/datePickerV2Updated_dsl.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper;

describe("DatePicker Widget Property pane tests with js bindings", function() {
  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });

  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Datepicker tooltip renders if tooltip prop is not empty", () => {
    cy.openPropertyPane("datepickerwidget2");
    // enter tooltip in property pan
    cy.get(widgetsPage.inputTooltipControl).type("Helpful text for tooltip !");
    // tooltip help icon shows
    cy.get(".datepicker-tooltip").should("be.visible");
  });
});

describe("DatePicker Widget required property test", () => {
  it("should should bring up a required error state when value is cleared ", () => {
    cy.openPropertyPane("datepickerwidget2");
    cy.wait(1000);
    //set the required condition to true in the property pane
    cy.get(".t--property-control-required label")
      .last()
      .click({ force: true });
    //preview changes
    cy.PublishtheApp();
    cy.wait(1000);
    //--wds-color-text-danger danger color var
    const cssDangerColor = "rgb(217, 25, 33)";
    //check intially that the input field required condition is fulfilled with a default value
    cy.get(".t--widget-datepickerwidget2 .bp3-input").should(
      "not.have.css",
      "border-color",
      cssDangerColor,
    );
    //clear input value
    cy.get(".t--widget-datepickerwidget2 .bp3-input").clear();
    //click outside the element to close the date picker modal
    cy.get("body").click(0, 0);
    cy.wait(1000);
    //check the input element has a danger color border since the required condition has not been fulfilled

    cy.get(".t--widget-datepickerwidget2 .bp3-input").should(
      "have.css",
      "border-color",
      cssDangerColor,
    );
  });
});
