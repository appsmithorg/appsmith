const { type } = require("os");
const commonlocators = require("../../../../../locators/commonlocators.json");
const explorer = require("../../../../../locators/explorerlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("JsonForm widget basis c usecases", function() {
  it("Validate Drag and drop jsonform widget", function() {
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("jsonformwidget", { x: 200, y: 200 });
    cy.openPropertyPane("jsonformwidget");
    cy.get(widgetsPage.jsonFormWidget).should("have.length", 1);
  });

  it("json form widget validate default data", function() {
    cy.openPropertyPane("jsonformwidget");
    cy.get(".t--jsonformfield-name input").should(
      "have.value",
      this.data.defaultSource.name,
    );
    cy.get(".t--jsonformfield-date_of_birth input").should(
      "have.value",
      this.data.defaultSource.date_of_birth,
    );
    cy.get(".t--jsonformfield-employee_id input").should(
      "have.value",
      this.data.defaultSource.employee_id,
    );
  });

  it("json form widget validate reset button function", function() {
    cy.openPropertyPane("jsonformwidget");
    cy.get(".t--jsonformfield-name input").clear({ force: true });
    cy.get(".t--jsonformfield-name input").type("TestReset");
    cy.get(".t--jsonformfield-employee_id input").clear({ force: true });
    cy.get(".t--jsonformfield-employee_id input").type("375");
    cy.get(".t--jsonformfield-name input").should(
      "not.have.value",
      this.data.defaultSource.name,
    );
    cy.get(".t--jsonformfield-employee_id input").should(
      "not.have.value",
      this.data.defaultSource.employee_id,
    );
    cy.get("button:contains('Reset')").click({ force: true });
    cy.get(".t--jsonformfield-name input").should(
      "have.value",
      this.data.defaultSource.name,
    );
    cy.get(".t--jsonformfield-employee_id input").should(
      "have.value",
      this.data.defaultSource.employee_id,
    );
  });

  it("Validate copy/paste/delete widget ", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //copy and paste
    cy.openPropertyPane("jsonformwidget");
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
    cy.get(widgetsPage.jsonFormWidget).should("have.length", 2);
    cy.deleteWidget(widgetsPage.jsonFormWidget);
    cy.get(widgetsPage.jsonFormWidget).should("have.length", 1);
  });
});
