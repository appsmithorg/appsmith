const commonlocators = require("../../../../../locators/commonlocators.json");
const Layoutpage = require("../../../../../locators/Layout.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/layoutdsl.json");

describe("Tab widget test", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Tab Widget Functionality Test", function() {
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
    cy.testJsontext("defaulttab", "test");
    cy.get(Layoutpage.tabWidget)
      .contains("test")
      .click({ force: true })
      .should("be.visible");
    cy.get(Layoutpage.tabButton).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.tabVerify(1, "Day");
    cy.get(Layoutpage.tabDelete)
      .eq(1)
      .click({ force: true });
    cy.get(Layoutpage.tabWidget)
      .contains("Day")
      .should("not.exist");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(300);
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(widgetsPage.Scrollbutton);
    cy.get(Layoutpage.tabContainer)
      .scrollIntoView({ easing: "linear" })
      .should("be.visible");
    cy.PublishtheApp();
  });
  it("Tab Widget Functionality To Select Tabs", function() {
    cy.get(publish.tabWidget)
      .contains(this.data.tabName)
      .click({ force: true })
      .should("have.class", "is-selected");
    cy.get(publish.backToEditor).click();
  });
  it("Tab Widget Functionality To Unchecked Visible Widget", function() {
    cy.openPropertyPane("tabswidget");
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.tabWidget).should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Tab Widget Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("tabswidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.tabWidget).should("be.visible");
    cy.get(publish.backToEditor).click();
  });
  it("Tab Widget Functionality To Check tab invisiblity", function() {
    cy.openPropertyPane("tabswidget");
    cy.get(Layoutpage.tabEdit)
      .eq(1)
      .click({ force: true });
    cy.get(Layoutpage.tabVisibility)
      .first()
      .click({ force: true });
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 1")
      .should("not.exist");
    cy.PublishtheApp();
    cy.get(publish.tabWidget)
      .contains("Tab 1")
      .should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Tab Widget Functionality To Check tab visibility", function() {
    cy.openPropertyPane("tabswidget");
    cy.get(Layoutpage.tabEdit)
      .eq(1)
      .click({ force: true });
    cy.get(Layoutpage.tabVisibility)
      .first()
      .click({ force: true });
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 1")
      .should("be.visible");
    cy.PublishtheApp();
    cy.get(publish.tabWidget)
      .contains("Tab 1")
      .should("be.visible");
    cy.get(publish.backToEditor).click();
  });
  /* Test to be revisted as the undo action is inconsistent in automation
  it("Tab Widget Functionality To Check undo action after delete", function() {
    cy.openPropertyPane("tabswidget");
    cy.get(Layoutpage.tabDelete)
      .eq(1)
      .click({ force: true });
    cy.wait(2000);
    cy.wait("@updateLayout");
    cy.get(publish.tabWidget)
      .contains("Tab 1")
      .should("not.exist");
    cy.get(".undo-section:contains('UNDO')")
      .should("be.visible")
      .click({ force: true });
    cy.wait(2000);
    cy.wait("@updateLayout");
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 1")
      .should("be.visible");
    cy.PublishtheApp();
    cy.get(publish.tabWidget)
      .contains("Tab 1")
      .should("be.visible");
  });
  */
  it("Tabs widget should have navigation arrows if tabs don't fit", function() {
    const rightNavButtonSelector =
      Layoutpage.tabWidget + " .scroll-nav-right-button";
    const leftNavButtonSelector =
      Layoutpage.tabWidget + " .scroll-nav-left-button";

    cy.openPropertyPane("tabswidget");
    // Add a new tab
    cy.get(Layoutpage.tabButton).click({ force: true });
    cy.get(Layoutpage.tabButton).click({ force: true });
    cy.tabVerify(3, "Tab3-for-testing-scroll-navigation-controls");
    // Should show off right navigation arrow
    cy.get(leftNavButtonSelector).should("exist");
    // Click on the right navigation arrow
    cy.get(leftNavButtonSelector).click({ force: true });
    // Should show off left navigation arrow
    cy.get(rightNavButtonSelector).should("exist");
  });
  it("Tab Widget Functionality To Check Default Tab selected After Selected Tab Delete", function() {
    cy.testJsontext("defaulttab", "Tab 2");
    cy.tabVerify(3, "Tab3-for-testing-scroll-navigation-controls");
    cy.get(Layoutpage.tabWidget)
      .contains("Tab3-for-testing-scroll-navigation-controls")
      .should("have.class", "is-selected");
    cy.get(Layoutpage.tabDelete)
      .eq(3)
      .click({ force: true });
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 2")
      .should("have.class", "is-selected");
  });
  it("Tab Widget Functionality To Check First Tab Selected After Selected Tab(Default one) Delete", function() {
    cy.get(Layoutpage.tabDelete)
      .eq(2)
      .click({ force: true });
    cy.get(Layoutpage.tabWidget)
      .contains("Aditya")
      .should("have.class", "is-selected");
  });
});

afterEach(() => {
  // put your clean up code if any
});
