const widgetsPage = require("../../../../locators/Widgets.json");
const commonLocators = require("../../../../locators/commonlocators.json");
const explorer = require("../../../../locators/explorerlocators.json");
const dsl = require("../../../../fixtures/WidgetCopyPaste.json");
const generatePage = require("../../../../locators/GeneratePage.json");

const widgetSelector = (name) => `[data-widgetname-cy="${name}"]`;
describe("Widget Copy paste", function () {
  const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. When non Layout widget is selected, it should place below the widget selected", function () {
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

  it("2. When Layout widget is selected, it should place it inside the layout widget", function () {
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

  it("3. When widget inside the layout widget is selected, then it should paste inside the layout widget below the selected widget", function () {
    cy.get(`#div-selection-0`).click({
      force: true,
    });

    // Selection
    cy.get(`#${dsl.dsl.children[0].widgetId}`)
      .find(widgetsPage.chartWidget)
      .click({
        ctrlKey: true,
      });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);
    cy.get(`#${dsl.dsl.children[0].widgetId}`)
      .find(widgetsPage.chartWidget)
      .should("have.length", 2);
  });

  it("4. When modal is open, it should paste inside the modal", () => {
    //add modal widget
    cy.get(explorer.addWidget).click();
    cy.dragAndDropToCanvas("modalwidget", { x: 300, y: 700 });
    cy.get(".t--modal-widget").should("exist");

    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);
    cy.get(".t--modal-widget")
      .find(widgetsPage.chartWidget)
      .should("have.length", 1);
  });

  it("5. When widget Inside a modal is selected, it should paste inside the modal", () => {
    //verify modal and selected widget
    cy.get(".t--modal-widget").should("exist");
    cy.get(".t--modal-widget")
      .find(`div[data-testid='t--selected']`)
      .should("have.length", 1);

    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);
    // cy.get(explorer.explorerSwitchId).click();
    // cy.get(explorer.entityModal).click();
    cy.get(".t--modal-widget")
      .find(widgetsPage.chartWidget)
      .should("have.length", 2);
  });

  it("6. Should be able to paste list widget inside another list widget", function () {
    //clean up
    cy.get(`#div-selection-0`).click({
      force: true,
    });
    cy.get("body").type(`{${modifierKey}}{a}`);
    cy.get("body").type("{del}");

    //add list widget
    cy.get(explorer.widgetSwitchId).click();
    cy.dragAndDropToCanvas("listwidgetv2", { x: 500, y: 700 });
    cy.get(`div[data-testid='t--selected']`).should("have.length", 1);

    //copy
    cy.get("body").type(`{${modifierKey}}{c}`);

    //paste
    cy.get(`${widgetSelector("List1")} [type="CONTAINER_WIDGET"]`)
      .first()
      .type(`{${modifierKey}}{v}`);
    cy.get(widgetsPage.listWidgetv2).should("have.length", 4);
    cy.get(`${widgetSelector("List1")} [type="CONTAINER_WIDGET"]`)
      .first()
      .find(widgetsPage.listWidgetv2)
      .should("have.length", 1);
  });

  it("7. Should be able to paste widget on the initial generate Page", function () {
    cy.Createpage("NewPage", false);

    //paste
    cy.get("body").type(`{${modifierKey}}{v}`);

    //verify a pasted list widget
    cy.get(widgetsPage.listWidgetv2).should("have.length", 1);
  });
});
