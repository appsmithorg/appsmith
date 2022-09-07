const dslWithoutSchema = require("../../../../../fixtures/jsonFormDslWithoutSchema.json");
const dslWithSchema = require("../../../../../fixtures/jsonFormDslWithSchema.json");

describe("JSONForm Footer spec", () => {
  it("1. sticks to the bottom when fixed footer is true and content is less", () => {
    cy.addDsl(dslWithoutSchema);
    // add small source data
    const sourceData = {
      name: "John",
    };
    cy.openPropertyPane("jsonformwidget");
    cy.testJsontext("sourcedata", JSON.stringify(sourceData));

    // check if fixed footer enabled
    cy.get(".t--property-control-fixedfooter")
      .find("label.bp3-control")
      .should("have.class", "checked");

    // Check if there is a gap between body and footer
    cy.get(".t--jsonform-body").then(($body) => {
      cy.get(".t--jsonform-footer").then(($footer) => {
        const gap = $footer.prop("offsetTop") - $body.prop("scrollHeight");

        expect(gap).greaterThan(0);
      });
    });
  });

  it("2. sticks to the content when fixed footer is off", () => {
    // Disable fixed footer
    cy.togglebarDisable(".t--property-control-fixedfooter input");

    // Check if there is a gap between body and footer
    cy.get(".t--jsonform-body").then(($body) => {
      cy.get(".t--jsonform-footer").then(($footer) => {
        const gap = $footer.prop("offsetTop") - $body.prop("scrollHeight");

        expect(gap).equals(0);
      });
    });
  });

  it("3. floats to the bottom when fixed footer is true and content overflows", () => {
    cy.addDsl(dslWithSchema);
    cy.addDsl(dslWithSchema);
    cy.wait(3000); //for dsl to settle

    cy.openPropertyPane("jsonformwidget");
    // check if fixed footer enabled
    cy.get(".t--property-control-fixedfooter")
      .find("label.bp3-control")
      .should("have.class", "checked");

    // Check if footer is floating
    cy.get(".t--draggable-jsonformwidget")
      .find("form")
      .then(($form) => {
        cy.get(".t--jsonform-footer").then(($footer) => {
          const gap =
            $footer.prop("offsetTop") +
            $footer.prop("offsetHeight") -
            $form.prop("offsetHeight");

          expect(gap).equals(0);
        });
      });
  });

  it("4. floats to the bottom when fixed footer is false and content overflows", () => {
    // Disable fixed footer
    cy.togglebarDisable(".t--property-control-fixedfooter input");

    // Check if footer is floating
    cy.get(".t--draggable-jsonformwidget")
      .find("form")
      .then(($form) => {
        cy.get(".t--jsonform-footer").then(($footer) => {
          const gap =
            $footer.prop("offsetTop") +
            $footer.prop("offsetHeight") -
            $form.prop("scrollHeight");

          expect(gap).equals(0);
        });
      });
  });
});
