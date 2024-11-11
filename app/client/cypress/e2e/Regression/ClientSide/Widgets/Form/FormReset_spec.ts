import * as _ from "../../../../../support/Objects/ObjectsCore";
import widgets from "../../../../../locators/Widgets.json";

describe(
  "Form reset functionality",
  { tags: ["@tag.Widget", "@tag.Form", "@tag.Binding"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("formResetDsl");
    });

    it("Resets the form", () => {
      // Select a row and verify
      cy.get(".tr").eq(2).click().should("have.class", "selected-row");
      cy.wait(2000);
      cy.get(".rc-select-selection-overflow").click({ force: true });
      cy.dropdownMultiSelectDynamic("Option 1");
      cy.dropdownMultiSelectDynamic("Option 2");
      cy.dropdownMultiSelectDynamic("Option 3");
      // Verify input should include the name "lindsay.ferguson@reqres.in"
      cy.get(".text-input-wrapper input")
        .eq(0)
        .invoke("attr", "value")
        .should("contain", "lindsay.ferguson@reqres.in");
      // Reset the form
      cy.get("button:contains('Reset')").click({ force: true });
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
      // verify table should not have selected row
      cy.get(".tr").eq(2).should("not.have.class", "selected-row");
      // Verify dropdown does not have selected values
      cy.get(`${widgets.selectWidget} .bp3-tag-input-values .bp3-tag`).should(
        ($span) => {
          expect($span).to.have.length(0);
        },
      );
      // Verify input should not include "lindsay.ferguson@reqres.in"
      cy.get(".text-input-wrapper input")
        .eq(0)
        .invoke("attr", "value")
        .should("not.contain", "lindsay.ferguson@reqres.in");

      // input widgets should not be in error state
      cy.get(".text-input-wrapper input")
        .eq(0)
        .should("not.have.css", "border-color", "rgb(242, 43, 43)");

      cy.get(".text-input-wrapper input")
        .eq(0)
        .should("not.have.css", "border-color", "rgb(242, 43, 43)");

      cy.get(".text-input-wrapper input")
        .eq(1)
        .should("not.have.css", "border-color", "rgb(242, 43, 43)");

      // Earlier select widget used to remain in error state which wasn't an expected behavior after reset
      // now even select widget will not show error after reset.
      cy.get(`.rc-select-selection-overflow`).should(
        "not.have.css",
        "border-color",
        "rgb(242, 43, 43)",
      );
    });
  },
);
