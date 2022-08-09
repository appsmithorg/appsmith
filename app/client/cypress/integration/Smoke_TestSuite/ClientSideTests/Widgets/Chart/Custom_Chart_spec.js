const commonlocators = require("../../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/chartUpdatedDsl.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("Chart Widget Functionality around custom chart feature", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("chartwidget");
  });

  it("1. Fill the Chart Widget Properties.", function() {
    //changing the Chart Name
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
    //changing the Chart Title
    /**
     * @param{Text} Random Input Value
     */
    cy.testCodeMirror(this.data.chartIndata);
    cy.get(viewWidgetsPage.chartInnerText)
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

    //Close edit prop

    cy.PublishtheApp();
  });

  it("2. Custom Chart Widget Functionality", function() {
    //changing the Chart type
    //cy.get(widgetsPage.toggleChartType).click({ force: true });
    cy.UpdateChartType("Custom Chart");

    cy.testJsontext(
      "customfusionchart",
      `{{${JSON.stringify(this.data.ChartCustomConfig)}}}`,
    );

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    cy.PublishtheApp();
  });

  it("3. Toggle JS - Custom Chart Widget Functionality", function() {
    cy.get(widgetsPage.toggleChartType).click({ force: true });
    //changing the Chart type
    cy.testJsontext("charttype", "CUSTOM_FUSION_CHART");
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
    cy.get(viewWidgetsPage.Chartlabel + ":first-child", {
      timeout: 10000,
    }).should("have.css", "opacity", "1");
    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });

    //Close edit prop
    cy.PublishtheApp();
  });

  it("4. Chart-Copy Verification", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //Copy Chart and verify all properties
    cy.wait(1000);
    cy.copyWidget("chartwidget", viewWidgetsPage.chartWidget);

    cy.PublishtheApp();
  });

  it("5. Chart-Delete Verification", function() {
    // Delete the Chart widget
    cy.deleteWidget(viewWidgetsPage.chartWidget);
    cy.PublishtheApp();
    cy.get(viewWidgetsPage.chartWidget).should("not.exist");
  });

  afterEach(() => {
    cy.wait(2000);
    cy.get(publish.backToEditor).click({ force: true });
  });
});
