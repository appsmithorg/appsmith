import * as _ from "../../../../../support/Objects/ObjectsCore";
const commonlocators = require("../../../../../locators/commonlocators.json");
describe(
  "JSONForm Footer spec",
  { tags: ["@tag.Widget", "@tag.JSONForm", "@tag.Binding"] },
  () => {
    beforeEach(() => {
      _.agHelper.RestoreLocalStorageCache();
    });

    afterEach(() => {
      _.agHelper.SaveLocalStorageCache();
    });

    it("1. sticks to the bottom when fixed footer is true and content is less", () => {
      _.agHelper.AddDsl("jsonFormDslWithoutSchema");
      // add small source data
      const sourceData = {
        name: "John",
      };
      cy.openPropertyPane("jsonformwidget");
      _.propPane.EnterJSContext(
        "Source data",
        JSON.stringify(sourceData),
        true,
      );

      // check if fixed footer enabled
      cy.get(".t--property-control-fixedfooter")
        .find(".ads-v2-switch input")
        .should("be.checked");

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
      _.agHelper.CheckUncheck(commonlocators.fixedFooterInput, false);

      // Check if there is a gap between body and footer
      cy.get(".t--jsonform-body").then(($body) => {
        cy.get(".t--jsonform-footer").then(($footer) => {
          const gap = $footer.prop("offsetTop") - $body.prop("scrollHeight");

          expect(gap).equals(1);
        });
      });
    });

    it("3. floats to the bottom when fixed footer is true and content overflows", () => {
      _.agHelper.AddDsl("jsonFormDslWithSchema");
      _.agHelper.AddDsl("jsonFormDslWithSchema"); //Should not be needed, to check

      cy.openPropertyPane("jsonformwidget");
      cy.get(_.locators._jsToggle("sourcedata")).click({ force: true });
      // check if fixed footer enabled
      cy.get(".t--property-control-fixedfooter")
        .find(".ads-v2-switch input")
        .should("be.checked");

      // Check if footer is floating
      cy.get(".t--draggable-jsonformwidget")
        .find("form")
        .then(($form) => {
          cy.get(".t--jsonform-footer").then(($footer) => {
            const gap =
              $footer.prop("offsetTop") +
              $footer.prop("offsetHeight") -
              $form.prop("offsetHeight");

            expect(gap).equals(1);
          });
        });
    });

    it("4. floats to the bottom when fixed footer is false and content overflows", () => {
      // Disable fixed footer
      _.agHelper.CheckUncheck(commonlocators.fixedFooterInput, false);

      // Check if footer is floating
      cy.get(".t--draggable-jsonformwidget")
        .find("form")
        .then(($form) => {
          cy.get(".t--jsonform-footer").then(($footer) => {
            const gap =
              $footer.prop("offsetTop") +
              $footer.prop("offsetHeight") -
              $form.prop("scrollHeight");

            expect(gap).equals(1);
          });
        });
    });
  },
);
