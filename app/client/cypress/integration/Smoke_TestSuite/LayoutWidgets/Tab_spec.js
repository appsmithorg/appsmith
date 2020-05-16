const commonlocators = require("../../../locators/commonlocators.json");
const Layoutpage = require("../../../locators/Layout.json");
const widgetsPage = require("../../../locators/Widgets.json");
const dsl = require("../../../fixtures/layoutdsl.json");

describe("Tab widget test", function() {
  beforeEach(() => {
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
    cy.get(Layoutpage.tabDefault)
      .type(this.data.command)
      .type("test");
    cy.get(Layoutpage.tabWidget)
      .contains("test")
      .click({ force: true })
      .should("be.visible");
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

  afterEach(() => {
    // put your clean up code if any
  });
});
