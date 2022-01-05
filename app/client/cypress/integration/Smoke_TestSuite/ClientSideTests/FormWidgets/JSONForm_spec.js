const dsl = require("../../../../fixtures/jsonFormDsl.json");

const fieldPrefix = ".t--jsonformfield";

describe("New JSON Form Widget Functionality", () => {
  before(() => {
    cy.addDsl(dsl);
  });

  it("generates fields with valid source data json", () => {
    const sourceData = {
      name: "John",
      age: 30,
      dob: "10/12/1992",
      migrant: false,
      address: {
        line1: "Koramangala",
        city: "Bangalore",
      },
      education: [
        {
          college: "MIT",
          year: "20/10/2014",
        },
      ],
    };

    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));

    cy.get(`${fieldPrefix}-name label`).contains("Name");
    cy.get(`${fieldPrefix}-name input`).then((input) => {
      cy.wrap(input).should("have.value", "John");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-age label`).contains("Age");
    cy.get(`${fieldPrefix}-age input`).then((input) => {
      cy.wrap(input).should("have.value", 30);
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-dob label`).contains("Dob");
    cy.get(`${fieldPrefix}-dob input`).then((input) => {
      cy.wrap(input).should("have.value", "10/12/1992");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-migrant label`).contains("Migrant");
    cy.get(`${fieldPrefix}-migrant .t--switch-widget-inactive`).should("exist");

    cy.get(`${fieldPrefix}-address`)
      .find("label")
      .should("have.length", 3);
    cy.get(`${fieldPrefix}-address.line1 label`).contains("Line1");
    cy.get(`${fieldPrefix}-address.line1 input`).then((input) => {
      cy.wrap(input).should("have.value", "Koramangala");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-address.city label`).contains("City");
    cy.get(`${fieldPrefix}-address.city input`).then((input) => {
      cy.wrap(input).should("have.value", "Bangalore");
      cy.wrap(input)
        .invoke("attr", "type")
        .should("contain", "text");
    });

    cy.get(`${fieldPrefix}-education label`).should("have.length", 3);
  });
});
