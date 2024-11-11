const commonlocators = require("../../../../../locators/commonlocators.json");

const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";

describe(
  "List widget v2 Copy and Paste",
  { tags: ["@tag.Widget", "@tag.List", "@tag.Binding"] },
  () => {
    it("1. Validate Copy paste action", () => {
      cy.dragAndDropToCanvas("listwidgetv2", {
        x: 300,
        y: 300,
      });
      cy.openPropertyPane("imagewidget");
      cy.get(commonlocators.PropertyPaneSearchInput).type("border");
      cy.get(commonlocators.BorderRadius0px).click({ force: true });

      cy.openPropertyPane("listwidgetv2");

      cy.get("body").type(`{${modifierKey}}c`);
      cy.wait(500);
      cy.get('[id="div-selection-0"]').click();
      cy.get("body").type(`{${modifierKey}}v`, { force: true });
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );

      cy.get(".t--draggable-listwidgetv2").should("have.length", 2);
      cy.get(".t--draggable-imagewidget").should("have.length", 6);

      cy.get(".t--widget-textwidget span:contains('Blue')").should(
        "have.length",
        2,
      );
    });

    it("2. Validate Delete action", () => {
      // Represents the toast message is closed
      cy.get(commonlocators.toastmsg).should("not.exist");

      cy.openPropertyPane("listwidgetv2");
      cy.get("[data-testid='t--delete-widget']").click({ force: true });
      cy.get(".Toastify__toast-body").eq(0).contains("List1 is removed");
      cy.wait("@updateLayout").should(
        "have.nested.property",
        "response.body.responseMeta.status",
        200,
      );
    });
  },
);
