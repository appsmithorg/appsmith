const formWidgetsPage = require("../../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/widgetPopupDsl.json");

describe("Dropdown Widget Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Verify dropdown width of Select widgets and menu button", function () {
    // Select
    cy.wait(450);
    cy.get(formWidgetsPage.selectwidget)
      .find(widgetLocators.dropdownSingleSelect)
      .invoke("outerWidth")
      .then((val) => {
        cy.get(formWidgetsPage.selectwidget)
          .find(widgetLocators.dropdownSingleSelect)
          .click({
            force: true,
          });
        cy.get(".select-popover-wrapper")
          .invoke("outerWidth")
          .should("eq", val);
      });
    // Menu Button
    cy.get(formWidgetsPage.menuButtonWidget)
      .find(widgetLocators.menuButton)
      .invoke("outerWidth")
      .then((width) => {
        expect(parseInt(width)).to.equal(146);
      });
    cy.get(formWidgetsPage.menuButtonWidget)
      .find(widgetLocators.menuButton)
      .last()
      .click({
        force: true,
      });
    cy.log(cy.get(formWidgetsPage.menuButtonWidget));
    cy.get(".menu-button-popover")
      .invoke("outerWidth")
      .then((width) => {
        expect(parseInt(width)).to.equal(146);
      });

    // MultiSelect
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-multiple")
      .invoke("innerWidth")
      .then((inputWidth) => {
        cy.get(formWidgetsPage.multiselectwidgetv2)
          .find(".rc-select-selection-search-input")
          .first()
          .focus({ force: true })
          .type("{uparrow}", { force: true });
        cy.get(".multi-select-dropdown")
          .invoke("outerWidth")
          .then((dropdownWidth) => {
            expect(
              Math.floor(inputWidth) - Math.floor(dropdownWidth),
            ).to.be.lessThan(1);
          });
      });
    //Multi tree Select
    cy.get(formWidgetsPage.multiselecttreeWidget)
      .find(".rc-tree-select-multiple")
      .invoke("width")
      .then((val) => {
        cy.get(formWidgetsPage.multiselecttreeWidget)
          .find(".rc-tree-select-selection-search-input")
          .first()
          .focus({ force: true })
          .type("{uparrow}", { force: true });
        cy.get(".tree-multiselect-dropdown")
          .invoke("outerWidth")
          .then((dropdownWidth) => {
            expect(val - dropdownWidth).to.be.within(-1, 1);
          });
      });

    // Tree Select
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-single")
      .invoke("outerWidth")
      .then((val) => {
        cy.get(formWidgetsPage.singleselecttreeWidget)
          .find(".rc-tree-select-selection-search-input")
          .first()
          .focus({ force: true })
          .type("{uparrow}", { force: true });
        cy.get(".single-tree-select-dropdown")
          .invoke("outerWidth")
          .then((dropdownWidth) => {
            expect(val - dropdownWidth).to.be.within(-1, 1);
          });
      });
  });

  it("Verify dropdown width of Select widgets with Label", function () {
    // Select
    cy.openPropertyPane("selectwidget");
    cy.testJsontext("text", "Label");
    cy.get(formWidgetsPage.selectwidget)
      .find(widgetLocators.dropdownSingleSelect)
      .invoke("outerWidth")
      .then((val) => {
        cy.get(formWidgetsPage.selectwidget)
          .find(widgetLocators.dropdownSingleSelect)
          .click({
            force: true,
          });
        cy.get(".select-popover-wrapper")
          .invoke("outerWidth")
          .then((dropdownWidth) => {
            expect(val - dropdownWidth).to.be.within(-1, 1);
          });
      });

    // MultiSelect
    cy.openPropertyPane("multiselectwidgetv2");
    cy.testJsontext("text", "Label");
    cy.get(formWidgetsPage.multiselectwidgetv2)
      .find(".rc-select-multiple")
      .invoke("innerWidth")
      .then((val) => {
        cy.get(formWidgetsPage.multiselectwidgetv2)
          .find(".rc-select-selection-search-input")
          .first()
          .focus({ force: true })
          .type("{uparrow}", { force: true });
        cy.get(".multi-select-dropdown")
          .invoke("outerWidth")
          .then((dropdownWidth) => {
            expect(val - dropdownWidth).to.be.within(-1, 1);
          });
      });
    //Multi tree Select
    cy.openPropertyPane("multiselecttreewidget");
    cy.testJsontext("text", "Label");
    cy.get(formWidgetsPage.multiselecttreeWidget)
      .find(".rc-tree-select-multiple")
      .invoke("innerWidth")
      .then((val) => {
        cy.get(formWidgetsPage.multiselecttreeWidget)
          .find(".rc-tree-select-selection-search-input")
          .first()
          .focus({ force: true })
          .type("{uparrow}", { force: true });
        cy.get(".tree-multiselect-dropdown")
          .invoke("outerWidth")
          .then((dropdownWidth) => {
            expect(val - dropdownWidth).to.be.within(-1, 1);
          });
      });
    // Tree Select
    cy.openPropertyPane("singleselecttreewidget");
    cy.testJsontext("text", "Label");
    cy.get(formWidgetsPage.singleselecttreeWidget)
      .find(".rc-tree-select-single")
      .invoke("innerWidth")
      .then((val) => {
        cy.get(formWidgetsPage.singleselecttreeWidget)
          .find(".rc-tree-select-selection-search-input")
          .first()
          .focus({ force: true })
          .type("{uparrow}", { force: true });
        cy.get(".single-tree-select-dropdown")
          .invoke("outerWidth")
          .then((dropdownWidth) => {
            expect(val - dropdownWidth).to.be.within(-1, 1);
          });
      });
  });
});
