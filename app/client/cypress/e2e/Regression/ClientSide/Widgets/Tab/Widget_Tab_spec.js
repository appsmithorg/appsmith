const commonlocators = require("../../../../../locators/commonlocators.json");
const Layoutpage = require("../../../../../locators/Layout.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
import {
  agHelper,
  deployMode,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Tab widget test", { tags: ["@tag.Widget", "@tag.Tab" , "@tag.Binding"] }, function () {
  before(() => {
    agHelper.AddDsl("layoutdsl");
  });
  it("1. Tab Widget Functionality Test", function () {
    cy.openPropertyPane("tabswidget");
    /**
     * @param{Text} Random Text
     * @param{TabWidget}Mouseover
     * @param{TabPre Css} Assertion
     */
    cy.widgetText("tab", Layoutpage.tabWidget, widgetsPage.widgetNameSpan);
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
    cy.get(Layoutpage.tabButton).last().click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.tabVerify(1, "Day");
    cy.xpath(Layoutpage.deleteTab.replace("tabName", "Day")).click({
      force: true,
    });
    cy.get(Layoutpage.tabWidget).contains("Day").should("not.exist");
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    agHelper.CheckUncheck(widgetsPage.Scrollbutton);
    cy.get(Layoutpage.tabContainer)
      .scrollIntoView({ easing: "linear" })
      .should("be.visible");
    agHelper.AssertAutoSave();
    deployMode.DeployApp();
  });

  it("2. Tab Widget Functionality To Select Tabs", function () {
    cy.get(publish.tabWidget)
      .contains(this.dataSet.tabName)
      .last()
      .click({ force: true })
      .should("have.class", "is-selected");
    deployMode.NavigateBacktoEditor();
  });

  it("3. Tab Widget Functionality To Unchecked Visible Widget", function () {
    cy.openPropertyPane("tabswidget");
    agHelper.CheckUncheck(commonlocators.visibleCheckbox, false);
    deployMode.DeployApp();
    cy.get(publish.tabWidget).should("not.exist");
    deployMode.NavigateBacktoEditor();
  });

  it("4. Tab Widget Functionality To Check Visible Widget", function () {
    cy.openPropertyPane("tabswidget");
    agHelper.CheckUncheck(commonlocators.visibleCheckbox);
    deployMode.DeployApp();
    cy.get(publish.tabWidget).should("be.visible");
    deployMode.NavigateBacktoEditor();
  });

  it("5. Tab Widget Functionality To Check tab invisiblity", function () {
    cy.openPropertyPane("tabswidget");
    cy.xpath(Layoutpage.tabEdit.replace("tabName", "Tab 1")).click({
      force: true,
    });
    cy.get(Layoutpage.tabVisibility).first().click({ force: true });
    cy.get(Layoutpage.tabWidget).contains("Tab 1").should("not.exist");
    deployMode.DeployApp();
    cy.get(publish.tabWidget).contains("Tab 1").should("not.exist");
    deployMode.NavigateBacktoEditor();
  });

  it("6. Tab Widget Functionality To Check tab visibility", function () {
    cy.openPropertyPane("tabswidget");
    cy.xpath(Layoutpage.tabEdit.replace("tabName", "Tab 1")).click({
      force: true,
    });
    cy.get(Layoutpage.tabVisibility).first().click({ force: true });
    cy.get(Layoutpage.tabWidget).contains("Tab 1").should("be.visible");
    deployMode.DeployApp();
    cy.get(publish.tabWidget).contains("Tab 1").should("be.visible");
    deployMode.NavigateBacktoEditor();
  });
  /* Test to be revisted as the undo action is inconsistent in automation
  it("7. Tab Widget Functionality To Check undo action after delete", function() {
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
    deployMode.DeployApp();
    cy.get(publish.tabWidget)
      .contains("Tab 1")
      .should("be.visible");
  });
  */
  it("7. Tabs widget should have navigation arrows if tabs don't fit", function () {
    const rightNavButtonSelector =
      Layoutpage.tabWidget + " .scroll-nav-right-button";
    const leftNavButtonSelector =
      Layoutpage.tabWidget + " .scroll-nav-left-button";

    cy.openPropertyPane("tabswidget");
    // Add a new tab
    agHelper.ClickButton("Add tab");
    agHelper.ClickButton("Add tab");
    cy.tabVerify(3, "Tab3-for-testing-scroll-navigation-controls");
    // Should show off right navigation arrow
    cy.get(leftNavButtonSelector).should("exist");
    // Click on the right navigation arrow
    cy.get(leftNavButtonSelector).click({ force: true });
    // Should show off left navigation arrow
    cy.get(rightNavButtonSelector).should("exist");
  });

  it("8. Tab Widget Functionality To Check Default Tab selected After Selected Tab Delete", function () {
    propPane.UpdatePropertyFieldValue("Default tab", "Tab 1");
    cy.tabVerify(3, "Tab3-for-testing-scroll-navigation-controls");
    cy.get(Layoutpage.tabWidget)
      .contains("Tab3-for-testing-scroll-navigation-controls")
      .should("have.class", "is-selected");
    cy.xpath(
      Layoutpage.deleteTab.replace(
        "tabName",
        "Tab3-for-testing-scroll-navigation-controls",
      ),
    ).click({ force: true });
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 1")
      .should("have.class", "is-selected");
  });

  it("9. Tab Widget Functionality To Check First Tab Selected After Selected Tab(Default one) Delete", function () {
    cy.get(Layoutpage.tabDelete).eq(1).click({ force: true });
    cy.wait(1000);
    cy.get(Layoutpage.tabWidget)
      .contains("Aditya")
      .should("have.class", "is-selected");
    // Validates Total Number Of Tabs Displayed In The Property Pane
    cy.get(Layoutpage.tabNumber).should("have.text", "2");
    // Validates Total Number Of Tabs Displayed In The Property Pane After Adding A Tab
    agHelper.ClickButton("Add tab");
    cy.get(Layoutpage.tabNumber).should("have.text", "3");
    //Validates Total Number Of Tabs Displayed In The Property Pane After Deleting A Tab
    cy.get(Layoutpage.tabDelete).eq(1).click({ force: true });
    cy.get(Layoutpage.tabNumber).should("have.text", "2");
  });
});

afterEach(() => {
  // put your clean up code if any
});
