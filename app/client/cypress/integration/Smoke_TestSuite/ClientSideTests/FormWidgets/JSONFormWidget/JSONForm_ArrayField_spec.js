const commonlocators = require("../../../../../locators/commonlocators.json");
const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");

const fieldPrefix = ".t--jsonformfield";
const education = `${fieldPrefix}-education`;
const addButton = ".t--jsonformfield-array-add-btn";
const deleteButton = ".t--jsonformfield-array-delete-btn";

describe("JSON Form Widget Array Field", () => {
  before(() => {
    cy.addDsl(dslWithSchema);
  });

  it("can add more items to the field", () => {
    cy.openPropertyPane("jsonformwidget");

    cy.get(`${education}-item`)
      .should("have.length", 1)
      .within(() => {
        cy.get(`${education}-0--college input`).should("have.value", "MIT");
        cy.get(`${education}-0--year input`).should("have.value", "20/10/2014");
      });

    cy.get(`${education} ${addButton}`).click({ force: true });

    cy.get(`${education}-item`)
      .should("have.length", 2)
      .within(() => {
        cy.get(`${education}-0--college input`).should("have.value", "MIT");
        cy.get(`${education}-0--year input`).should("have.value", "20/10/2014");
        cy.get(`${education}-1--college input`).should("have.value", "");
        cy.get(`${education}-1--year input`).should("have.value", "");
      });
  });

  it("can remove items from the field", () => {
    cy.get(`${education} ${addButton}`).click({ force: true });
    cy.get(`${education}-item`).should("have.length", 3);

    cy.get(`${education}-item`).within(() => {
      cy.get(`${education}-1--college input`).type("Dummy college");
      cy.get(`${education}-1--year input`).type("10/08/2010");
    });

    cy.get(commonlocators.canvas).click({ force: true });

    cy.get(`${education}-item`).within(() => {
      cy.get(`${education}-2--college input`).type("Dummy college 2");
      cy.get(`${education}-2--year input`).type("01/01/2020");
    });

    cy.get(commonlocators.canvas).click({ force: true });

    cy.get(`${education}-item.t--item-1`)
      .find(deleteButton)
      .click({ force: true });

    cy.get(`${education}-item`).should("have.length", 2);

    cy.get(`${education}-item`).within(() => {
      cy.get(`${education}-1--college input`).should(
        "have.value",
        "Dummy college 2",
      );
      cy.get(`${education}-1--year input`).should("have.value", "01/01/2020");
    });
  });

  it("can change the visibility of the field", () => {
    cy.get(education).should("exist");

    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("education");

    // Visible -> false
    cy.togglebarDisable(".t--property-control-visible input");
    cy.get(education).should("not.exist");

    // Visible -> true
    cy.togglebar(".t--property-control-visible input");
    cy.get(education).should("exist");
  });

  it("disables all underlying field when array field is disabled", () => {
    cy.closePropertyPane();
    cy.openPropertyPane("jsonformwidget");
    cy.openFieldConfiguration("education");

    // Disable -> true
    cy.togglebar(".t--property-control-disabled input");
    cy.get(education).within(() => {
      cy.get(`${education}-0--college input`).should("have.attr", "disabled");
      cy.get(`${education}-0--year input`).should("have.attr", "disabled");
    });

    // Disable -> false
    cy.togglebarDisable(".t--property-control-disabled input");
    cy.get(education).should("exist");
    cy.get(education).within(() => {
      cy.get(`${education}-0--college input`).should(
        "not.have.attr",
        "disabled",
      );
      cy.get(`${education}-0--year input`).should("not.have.attr", "disabled");
    });
  });

  it("should not render field level default value if form level is present", () => {
    const collegeFieldDefaultValue = "College default value";

    cy.closePropertyPane();
    cy.openPropertyPane("jsonformwidget");

    cy.openFieldConfiguration("education")
      .openFieldConfiguration("__array_item__")
      .openFieldConfiguration("college");

    // Modify default text of eductation -> college field
    cy.testJsontext("defaultvalue", collegeFieldDefaultValue);
    cy.closePropertyPane();
    cy.get(`${education}-item`)
      .should("have.length", 1)
      .within(() => {
        cy.get(`${education}-0--college input`).should("have.value", "MIT");
        cy.get(`${education}-0--year input`).should("have.value", "20/10/2014");
      });

    // Add new item to education array
    cy.get(`${education} ${addButton}`).click({ force: true });

    cy.get(`${education}-item`)
      .should("have.length", 2)
      .within(() => {
        cy.get(`${education}-0--college input`).should("have.value", "MIT");
        cy.get(`${education}-0--year input`).should("have.value", "20/10/2014");
        cy.get(`${education}-1--college input`).should(
          "have.value",
          collegeFieldDefaultValue,
        );
        cy.get(`${education}-1--year input`).should("have.value", "");
      });
  });
});
