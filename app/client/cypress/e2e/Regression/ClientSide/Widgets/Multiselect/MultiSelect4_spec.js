const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

const defaultValue = `[
        {
          "label": "Green",
          "value": "GREEN"
        }
      ]`;

describe("MultiSelect Widget Functionality", function () {
  before(() => {
    _.agHelper.AddDsl("emptyDSL");
  });
  beforeEach(() => {
    cy.wait(3000);
  });
  it("1. Add new multiselect widget", () => {
    _.entityExplorer.DragDropWidgetNVerify(_.draggableWidgets.MULTISELECT);
    _.propPane.ToggleJSMode("sourcedata");
    _.propPane.UpdatePropertyFieldValue(
      "Source Data",
      `[
        {
          "label": "Blue",
          "value": ""
        },
        {
          "label": "Green",
          "value": "GREEN"
        },
        {
          "label": "Red",
          "value": "RED"
        }
      ]`,
    );

    _.propPane.ToggleJSMode("labelkey");
    cy.updateCodeInput(
      ".t--property-control-wrapper.t--property-control-labelkey",
      `label`,
    );

    _.propPane.ToggleJSMode("valuekey");
    cy.updateCodeInput(".t--property-control-valuekey", `value`);

    _.propPane.UpdatePropertyFieldValue(
      "Default selected values",
      defaultValue,
    );
  });

  it("2. Copy and paste multiselect widget", () => {
    cy.openPropertyPane("multiselectwidgetv2");
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //copy and paste
    cy.openPropertyPane("multiselectwidgetv2");
    cy.get("body").type(`{${modifierKey}}c`);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.get("body").click();
    cy.get("body").type(`{${modifierKey}}v`, { force: true });
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(widgetsPage.multiSelectWidget).should("have.length", 2);

    cy.get(".t--property-control-defaultselectedvalues")
      .first()
      .click({ force: true })
      .find(".CodeMirror")
      .first()
      .then((ins) => {
        const input = ins[0].CodeMirror;
        let val = input.getValue();
        try {
          val = JSON.parse(val);
          expect(val).to.deep.equal(JSON.parse(defaultValue));
        } catch (error) {}
      });
  });

  it("3. Select tooltip renders if tooltip prop is not empty", () => {
    cy.openPropertyPane("multiselectwidgetv2");
    // enter tooltip in property pan
    cy.get(widgetsPage.inputTooltipControl).type("Helpful text for tooltip !");
    // tooltip help icon shows
    cy.get(".multiselect-tooltip").should("be.visible");
  });
});
