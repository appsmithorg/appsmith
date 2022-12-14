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
