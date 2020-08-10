const commonlocators = require("../../../locators/commonlocators.json");
const Layoutpage = require("../../../locators/Layout.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/layoutdsl.json");
const pages = require("../../../locators/Pages.json");

describe("Tab widget test", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Tab Widget Functionality Test", function() {
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("tabswidget");
    /**
     * @param{Text} Random Text
     * @param{TabWidget}Mouseover
     * @param{TabPre Css} Assertion
     */
    cy.widgetText("tab", Layoutpage.tabWidget, Layoutpage.tabInput);
    /**
     * @param{IndexValue} Provide input Index Value
     * @param{Text} Provide Index Text Value
     */
    cy.tabVerify(0, "Aditya");
    cy.tabVerify(1, "test");
    //Default  tab selection and validation
    cy.get(Layoutpage.tabDefault)
      .type(this.data.command)
      .type("test");
    cy.get(Layoutpage.tabWidget)
      .contains("test")
      .click({ force: true })
      .should("be.visible");
    cy.get(Layoutpage.tabButton).click({ force: true });
    cy.tabVerify(2, "Day");
    cy.get(Layoutpage.tabDelete)
      .eq(2)
      .click({ force: true });
    cy.get(Layoutpage.tabWidget)
      .contains("Day")
      .should("not.to.be.visible");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(widgetsPage.Scrollbutton)
      .check({ force: true })
      .should("be.checked");
    cy.get(Layoutpage.tabContainer)
      .scrollIntoView({ easing: "linear" })
      .should("be.visible");
    cy.get(commonlocators.crossbutton).click({ force: true });
    cy.PublishtheApp();
  });
  it("Tab Widget Functionality To Select Tabs", function() {
    cy.get(publish.tabWidget)
      .contains(this.data.tabName)
      .click({ force: true })
      .should("be.selected");
  });
  it("Tab Widget Functionality To Unchecked Visible Widget", function() {
    cy.get(publish.backToEditor).click();
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("tabswidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.tabWidget).should("not.be.visible");
    cy.get(publish.backToEditor).click();
  });
  it("Tab Widget Functionality To Check Visible Widget", function() {
    cy.get(pages.widgetsEditor).click();
    cy.openPropertyPane("tabswidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.tabWidget).should("be.visible");
  });
});
afterEach(() => {
  // put your clean up code if any
});
