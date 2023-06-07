const commonlocators = require("../../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/chartUpdatedDsl.json");
const modalWidgetPage = require("../../../../../locators/ModalWidget.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("Chart Widget Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("chartwidget");
  });

  it("1. Fill the Chart Widget Properties.", function () {
    //changing the Chart Name
    /**
     * @param{Text} Random Text
     * @param{ChartWidget}Mouseover
     * @param{ChartPre Css} Assertion
     */
    cy.widgetText(
      "Test",
      viewWidgetsPage.chartWidget,
      widgetsPage.widgetNameSpan,
    );
    cy.EnableAllCodeEditors();
    //changing the Chart Title
    /**
     * @param{Text} Random Input Value
     */
    cy.testJsontext("title", this.data.chartIndata);
    cy.get(viewWidgetsPage.chartInnerText)
      .click()
      .contains("App Sign Up")
      .should("have.text", "App Sign Up");

    //Entering the Chart data
    cy.testJsontext(
      "chart-series-data-control",
      JSON.stringify(this.data.chartInput),
    );
    cy.get(".t--propertypane").click("right");

    // Asserting Chart Height
    cy.get(viewWidgetsPage.chartWidget)
      .should("be.visible")
      .and((chart) => {
        expect(chart.height()).to.be.greaterThan(200);
      });

    //Entring the label of x-axis
    cy.get(viewWidgetsPage.xlabel)
      .click({ force: true })
      .type(this.data.command)
      .type(this.data.plan);
    //Entring the label of y-axis
    cy.get(viewWidgetsPage.ylabel)
      .click({ force: true })
      .type(this.data.command)
      .click({ force: true })
      .type(this.data.ylabel);

    cy.PublishtheApp();
  });

  it("2. Chart - Modal", function () {
    //creating the Modal and verify Modal name
    cy.createModal(this.data.ModalName, "onDataPointClick");
    cy.PublishtheApp();
    cy.get(widgetsPage.chartPlotGroup).children().first().click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.ModalName,
    );
  });

  it("3. Chart-Unckeck Visible field Validation", function () {
    // Making the widget invisible
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("not.exist");
  });

  it("4. Chart-Check Visible field Validation", function () {
    // Making the widget visible
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("be.visible");
  });

  it("5. Toggle JS - Chart-Unckeck Visible field Validation", function () {
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "false");
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("not.exist");
  });

  it("6. Toggle JS - Chart-Check Visible field Validation", function () {
    //Check the disabled checkbox using JS and Validate
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("be.visible");
  });

  it("7. Chart Widget Functionality To Uncheck Horizontal Scroll Visible", function () {
    cy.togglebarDisable(commonlocators.allowScroll);
    cy.PublishtheApp();
    cy.get(publish.horizontalTab).should("not.exist");
  });

  it("8. Chart Widget Functionality To Check Horizontal Scroll Visible", function () {
    cy.togglebar(commonlocators.allowScroll);
    cy.PublishtheApp();
    cy.get(publish.horizontalTab).eq(1).should("exist");
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
