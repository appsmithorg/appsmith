const commonlocators = require("../../../../locators/commonlocators.json");
const Layoutpage = require("../../../../locators/Layout.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/layoutdsl.json");
const pages = require("../../../../locators/Pages.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const explorer = require("../../../../locators/explorerlocators.json");

describe("Tab widget test", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("tabswidget");
  });

  it("Add widgets into tab", function() {
    cy.get(commonlocators.selectTab + ":nth-child(2)").click({ force: true });
    cy.get(explorer.addWidget).click();
    cy.get(commonlocators.entityExplorersearch).should("be.visible");
    cy.get(commonlocators.entityExplorersearch)
      .clear()
      .type("button");
    cy.dragAndDropToWidget("buttonwidget", "tabswidget", { x: 70, y: 100 });
    cy.get(commonlocators.entityExplorersearch)
      .clear()
      .type("input");
    cy.dragAndDropToWidget("inputwidget", "tabswidget", { x: 70, y: 180 });
    cy.PublishtheApp();
    cy.get(commonlocators.selectTab + ":nth-child(2)").click({ force: true });
    cy.get(publish.buttonWidget).should("be.visible");
    cy.get(publish.inputWidget).should("be.visible");
  });

  // it("Tab Widget Functionality to swap tabs", function() {
  // cy.get("[data-rbd-draggable-id='tab2'] div div div:first-child svg").then(
  //   ($button) => {
  //     cy.log($button.position());
  //   }
  // );
  // const dataTransfer = new DataTransfer;
  // cy.get(" [data-rbd-draggable-id='tab1']  div div div:first-child svg path")
  //     .trigger('dragstart', { dataTransfer });
  // cy.get("[data-rbd-draggable-id='tab2']")
  //     .trigger('drop', { dataTransfer });
  // cy.get("[data-rbd-draggable-id='tab1']")
  //     .trigger('dragend');

  //   cy.dragDropWidgetElements("[data-rbd-draggable-id='tab1']",".t--property-control-tabs",{ x: 90, y: 90 });
  //   cy.PublishtheApp();
  // });
  it("Tab Widget Functionality to Uncheck Show Tabs Validation", function() {
    cy.UncheckWidgetProperties(Layoutpage.showTabsCheckbox);
    cy.get(commonlocators.selectTab).should("not.exist");
    cy.PublishtheApp();
    cy.get(commonlocators.selectTab).should("not.exist");
  });
  it("Tab Widget Functionality to Check Show Tabs Validation", function() {
    cy.CheckWidgetProperties(Layoutpage.showTabsCheckbox);
    cy.get(commonlocators.selectTab).should("be.visible");
    cy.PublishtheApp();
    cy.get(commonlocators.selectTab).should("be.visible");
  });
  it("Expand and collapse General and Action", function() {
    // Open property pane
    cy.get(widgetsPage.collapseGeneral).click({ force: true });
    cy.wait(1000);
    cy.get(Layoutpage.tabsInPropertypane).should("not.be.visible");
    cy.get(widgetsPage.collapseGeneral).click({ force: true });
    cy.wait(1000);
    cy.get(Layoutpage.tabsInPropertypane).should("be.visible");
    cy.wait(1000);
    cy.get(widgetsPage.collapseAction).click({ force: true });
    cy.wait(1000);
    cy.get(widgetsPage.sectionAction).should("not.be.visible");
    cy.get(widgetsPage.collapseAction).click({ force: true });
    cy.wait(1000);
    cy.get(widgetsPage.sectionAction).should("be.visible");
  });
  it("Tab Widget Functionality to Validate Default Tab", function() {
    cy.PublishtheApp();
    cy.get(commonlocators.selectTab + ":first-child").should("be.selected");
  });
  it("Tab Widget Functionality to Validate Close PropertyPane", function() {
    // Open property pane
    cy.closePropertyPane();
    cy.get(commonlocators.tabDefaultComponent).should("not.exist");
  });
  it("Tab Widget Functionality to Explore Widget related documents", function() {
    // Click on "Explore widget related docs" Tabs
    cy.get(widgetsPage.exploreWidget).click();
    cy.wait(2000);
    // Verify the widget related document
    cy.get(widgetsPage.widgetRelatedDocument).should("contain", "Tabs");
    cy.wait(2000);
    cy.get("#header-root").click();
    cy.wait(1000);
    cy.closePropertyPane();
  });
  it("Tab Widget Functionality Test", function() {
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
    cy.openPropertyPane("tabswidget");
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
  });
  it("Tab Widget Functionality To Select Tabs", function() {
    cy.PublishtheApp();
    cy.get(publish.tabWidget)
      .contains(this.data.tabName)
      .click({ force: true })
      .should("be.selected");
  });
  it("Tab Widget Functionality To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.tabWidget).should("not.exist");
  });
  it("Tab Widget Functionality To Check Visible Widget", function() {
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.tabWidget).should("be.visible");
  });
  it("Toggle JS - Tab Widget Functionality To Unchecked Visible Widget", function() {
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "false");
    cy.PublishtheApp();
    cy.get(Layoutpage.tabContainer).should("not.exist");
  });
  it("Toggle JS - Tab Widget Functionality To Check Visible Widget", function() {
    //Check the disabled checkbox using JS and Validate
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(Layoutpage.tabContainer).should("be.visible");
  });
  it("Tab Widget Functionality To Check tab invisiblity", function() {
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
  });
  it("Tab Widget Functionality To Check tab visibility", function() {
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
  it("Toggle JS -Tab Widget Functionality To Check tab invisiblity", function() {
    cy.get(Layoutpage.tabEdit)
      .eq(1)
      .click({ force: true });
    cy.get(widgetsPage.toggleVisible)
      .first()
      .click({ force: true });
    cy.testJsontext("visible", "false");
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 1")
      .should("not.exist");
    cy.PublishtheApp();
    cy.get(publish.tabWidget)
      .contains("Tab 1")
      .should("not.exist");
  });
  it("Toggle JS -Tab Widget Functionality To Check tab visiblity", function() {
    cy.get(Layoutpage.tabEdit)
      .eq(1)
      .click({ force: true });
    cy.testJsontext("visible", "true");
    cy.get(Layoutpage.tabWidget)
      .contains("Tab 1")
      .should("be.visible");
    cy.PublishtheApp();
    cy.get(publish.tabWidget)
      .contains("Tab 1")
      .should("be.visible");
  });
  it("Tabs-Copy Validation", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //Copy `tab` and verify all properties
    cy.copyWidget("tabswidget", Layoutpage.tabWidget);
    // cy.PublishtheApp();
  });

  it("Tabs-Delete Validation", function() {
    // Delete the tab widget
    cy.deleteWidget(widgetsPage.buttonWidget);
    cy.PublishtheApp();
    cy.get(widgetsPage.buttonWidget).should("not.exist");
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
});

afterEach(() => {
  // put your clean up code if any
  cy.goToEditFromPublish();
});
