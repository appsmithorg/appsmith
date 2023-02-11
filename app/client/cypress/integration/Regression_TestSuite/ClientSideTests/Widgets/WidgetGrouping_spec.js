const dsl = require("../../../../fixtures/widgetSelection.json");

describe("Widget Grouping", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Select widgets using cmd + click and group using cmd + G", function() {
    // Selection
    cy.get(`#${dsl.dsl.children[2].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`#${dsl.dsl.children[3].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 2);
    cy.get(`.t--multi-selection-box`).should("have.length", 1);
    const isMac = Cypress.platform === "darwin";
    // Grouping
    if (isMac) {
      cy.get("body").type("{cmd}{g}");
    } else {
      cy.get("body").type("{ctrl}{g}");
    }
    cy.wait(2000);
    cy.get(`div[data-testid='t--selected']`)
      .should("have.length", 1)
      .as("group");
    cy.get("body").click();
    cy.get(`@group`)
      .find(`[data-testid="test-widget"]`)
      .should("have.length", 2);
    cy.get(`@group`).find(`.t--draggable-buttonwidget`);
    cy.get(`@group`).find(`.t--draggable-imagewidget`);

    // verify the position so that the camera widget is still below the newly grouped container
    cy.get(`.t--widget-containerwidget`)
      .eq(1)
      .then((element) => {
        const elementTop = parseFloat(element.css("top"));
        const elementHeight = parseFloat(element.css("height"));
        const containerBottom = (elementTop + elementHeight).toString() + "px";
        cy.get(`.t--widget-camerawidget`)
          .invoke("attr", "style")
          .should("contain", `top: ${containerBottom}`);
      });
  });
});
