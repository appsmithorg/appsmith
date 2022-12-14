const dsl = require("../../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

const defaultValue = `[
        {
          "label": "Green",
          "value": "GREEN"
        }
      ]`;

describe("MultiSelect Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.wait(3000);
  });
  it("1. Add new multiselect widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("multiselectwidgetv2", { x: 300, y: 300 });
    cy.get(".t--widget-multiselectwidgetv2").should("exist");
    cy.updateCodeInput(
      ".t--property-control-options",
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
    cy.updateCodeInput(
      ".t--property-control-defaultselectedvalues",
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
