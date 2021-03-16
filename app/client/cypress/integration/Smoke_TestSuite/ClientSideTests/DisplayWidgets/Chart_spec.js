const commonlocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/displayWidgetDsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Chart Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("chartwidget");
  });

  it("Chart Widget Functionality", function() {
    /**
     * @param{Text} Random Text
     * @param{ChartWidget}Mouseover
     * @param{ChartPre Css} Assertion
     */
    cy.widgetText(
      "Test",
      viewWidgetsPage.chartWidget,
      commonlocators.containerInnerText,
    );
    /**
     * @param{Text} Random Input Value
     */
    cy.testCodeMirror(this.data.chartIndata);
    cy.get(viewWidgetsPage.chartInnerText)
      .contains("App Sign Up")
      .should("have.text", "App Sign Up");

    cy.get(viewWidgetsPage.chartType)
      .last()
      .click({ force: true });

    cy.get(commonlocators.dropdownmenu)
      .children()
      .contains("Column Chart")
      .click();
    cy.get(viewWidgetsPage.chartType)
      .last()
      .should("have.text", "Column Chart");
    cy.testJsontext("chartseries", JSON.stringify(this.data.chartInput));
    cy.get(viewWidgetsPage.chartWidget)
      .should("be.visible")
      .and((chart) => {
        expect(chart.height()).to.be.greaterThan(200);
      });
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    cy.get(viewWidgetsPage.xlabel)
      .click({ force: true })
      .type(this.data.command)
      .type(this.data.plan);
    cy.get(viewWidgetsPage.ylabel)
      .click({ force: true })
      .type(this.data.command)
      .type(this.data.ylabel);
    //Close edit prop
    cy.get(commonlocators.editPropCrossButton).click();
  });
  it("Chart Widget Functionality To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Chart Widget Functionality To Check Visible Widget", function() {
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("be.visible");
    cy.get(publish.backToEditor).click();
  });
  it("Chart Widget Functionality To Uncheck Horizontal Scroll Visible", function() {
    cy.togglebarDisable(commonlocators.horizontalScroll);
    cy.PublishtheApp();
    cy.get(publish.horizontalTab).should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Chart Widget Functionality To Check Horizontal Scroll Visible", function() {
    cy.togglebar(commonlocators.horizontalScroll);
    cy.PublishtheApp();
    cy.get(publish.horizontalTab)
      .eq(1)
      .should("exist");
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
