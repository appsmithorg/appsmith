const dsl = require("../../../../../fixtures/emptyDSL.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

const defaultValue = `
        {
          "label": "Green",
          "value": "GREEN"
        }
      `;

describe("Select Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  beforeEach(() => {
    cy.wait(7000);
  });
  it("Add new Select widget", () => {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("selectwidget", { x: 300, y: 300 });
    cy.get(".t--widget-selectwidget").should("exist");
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
      ".t--property-control-defaultselectedvalue",
      defaultValue,
    );
  });

  it("Copy and paste select widget", () => {
    cy.openPropertyPane("selectwidget");
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //copy and paste
    cy.openPropertyPane("selectwidget");
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
    cy.get(widgetsPage.selectwidget).should("have.length", 2);

    cy.get(".t--property-control-defaultselectedvalue")
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
});
