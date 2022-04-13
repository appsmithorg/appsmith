const widgetsPage = require("../../../../locators/Widgets.json");
const commonLocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/WidgetCopyPaste.json");

describe("Widget Copy paste", function() {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  before(() => {
    cy.addDsl(dsl);
  });

  it("when non Layout widget is selected, it should place below the widget selected", function() {
    // Selection
    cy.get(`#${dsl.dsl.children[1].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //copy
    cy.get("body").type(`{${modifierKey}}{c}`);
    cy.get(commonLocators.toastmsg).contains("Copied");

    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);
    cy.get(widgetsPage.chartWidget).should("have.length", 2);

    // verify the position
    cy.get(widgetsPage.chartWidget)
      .eq(0)
      .then((element) => {
        const elementTop = parseFloat(element.css("top"));
        const elementHeight = parseFloat(element.css("height"));
        const pastedWidgetTop =
          (elementTop + elementHeight + 10).toString() + "px";
        cy.get(widgetsPage.chartWidget)
          .eq(1)
          .invoke("attr", "style")
          .should("contain", `left: ${element.css("left")}`)
          .should("contain", `top: ${pastedWidgetTop}`);
      });
  });

  it("when Layout widget is selected, it should place it inside the layout widget", function() {
    cy.get(`#div-selection-0`).click({
      force: true,
    });

    // Selection
    cy.get(`#${dsl.dsl.children[0].widgetId}`).click({
      ctrlKey: true,
    });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);

    cy.get(`#${dsl.dsl.children[0].widgetId}`)
      .find(widgetsPage.chartWidget)
      .should("have.length", 1);
  });
});
