const commonlocators = require("../../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const modalWidgetPage = require("../../../../../locators/ModalWidget.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Chart Widget Functionality", function () {
  before(() => {
    cy.fixture("chartUpdatedDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
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
    cy.testJsontext("title", this.dataSet.chartIndata);
    cy.get(viewWidgetsPage.chartInnerText)
      .click()
      .contains("App Sign Up")
      .should("have.text", "App Sign Up");

    //Entering the Chart data
    cy.testJsontext(
      "chart-series-data-control",
      JSON.stringify(this.dataSet.chartInput),
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
      .type(this.dataSet.command)
      .type(this.dataSet.plan);
    //Entring the label of y-axis
    cy.get(viewWidgetsPage.ylabel)
      .click({ force: true })
      .type(this.dataSet.command)
      .click({ force: true })
      .type(this.dataSet.ylabel);

    _.deployMode.DeployApp();
  });

  it("2. Pie Chart Widget Functionality", function () {
    //changing the Chart type
    cy.UpdateChartType("Pie chart");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.PieChartLabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("3. Line Chart Widget Functionality", function () {
    //changing the Chart type
    cy.UpdateChartType("Line chart");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel).eq(k).should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("4. Bar Chart Widget Functionality", function () {
    //changing the Chart type
    cy.UpdateChartType("Bar chart");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel).eq(k).should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("5. Area Chart Widget Functionality", function () {
    //changing the Chart type
    cy.UpdateChartType("Area chart");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel).eq(k).should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("6. Column Chart Widget Functionality", function () {
    //changing the Chart type
    cy.UpdateChartType("Column chart");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel).eq(k).should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("7. Toggle JS - Pie Chart Widget Functionality", function () {
    //changing the Chart type
    cy.get(widgetsPage.toggleChartType).click({ force: true });
    cy.testJsontext("charttype", "PIE_CHART");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.PieChartLabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("8. Toggle JS - Line Chart Widget Functionality", function () {
    //changing the Chart type
    cy.testJsontext("charttype", "LINE_CHART");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel).eq(k).should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("9. Toggle JS - Bar Chart Widget Functionality", function () {
    //changing the Chart type
    cy.testJsontext("charttype", "BAR_CHART");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel).eq(k).should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("10. Toggle JS - Area Chart Widget Functionality", function () {
    //changing the Chart type
    cy.testJsontext("charttype", "AREA_CHART");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel).eq(k).should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("11. Toggle JS - Column Chart Widget Functionality", function () {
    //changing the Chart type
    cy.testJsontext("charttype", "COLUMN_CHART");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .eq(k)
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel).eq(k).should("have.text", labels[k]);
    });
    _.deployMode.DeployApp();
  });

  it("12. Chart - Modal", function () {
    //creating the Modal and verify Modal name
    cy.createModal(this.dataSet.ModalName, "onDataPointClick");
    _.deployMode.DeployApp();
    cy.get(widgetsPage.chartPlotGroup).children().first().click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.dataSet.ModalName,
    );
  });

  it("13. Chart-Unckeck Visible field Validation", function () {
    // Making the widget invisible
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    _.deployMode.DeployApp();
    cy.get(publish.chartWidget).should("not.exist");
  });

  it("14. Chart-Check Visible field Validation", function () {
    // Making the widget visible
    cy.togglebar(commonlocators.visibleCheckbox);
    _.deployMode.DeployApp();
    cy.get(publish.chartWidget).should("be.visible");
  });

  it("15. Toggle JS - Chart-Unckeck Visible field Validation", function () {
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "false");
    _.deployMode.DeployApp();
    cy.get(publish.chartWidget).should("not.exist");
  });

  it("16. Toggle JS - Chart-Check Visible field Validation", function () {
    //Check the disabled checkbox using JS and Validate
    cy.testJsontext("visible", "true");
    _.deployMode.DeployApp();
    cy.get(publish.chartWidget).should("be.visible");
  });

  it("17. Chart Widget Functionality To Uncheck Horizontal Scroll Visible", function () {
    cy.togglebarDisable(commonlocators.allowScroll);
    _.deployMode.DeployApp();
    cy.get(publish.horizontalTab).should("not.exist");
  });

  it("18. Chart Widget Functionality To Check Horizontal Scroll Visible", function () {
    cy.togglebar(commonlocators.allowScroll);
    _.deployMode.DeployApp();
    cy.get(publish.horizontalTab).eq(1).should("exist");
  });

  it("19. Check Chart widget reskinning config", function () {
    cy.get(widgetsPage.toggleChartType).click({ force: true });
    cy.UpdateChartType("Column chart");

    // Check plot fill color
    cy.get("g[class*='plot-group'] rect").should(
      "have.css",
      "fill",
      "rgb(85, 61, 233)",
    );

    // Check axis name font size
    cy.get("g[class*='dataset-axis-name'] text").should(
      "have.css",
      "font-size",
      "14px",
    );

    // Check axis value font size and fill color
    cy.get("g[class$='dataset-axis'] text")
      .should("have.css", "font-size", "12px")
      .should("have.css", "fill", "rgb(113, 110, 110)");

    // Check axis caption's fontSize, and fill color
    cy.get("g[class$='caption'] text")
      .should("have.css", "font-size", "24px")
      .should("have.css", "fill", "rgb(35, 31, 32)");

    // Check base font family
    cy.get(".fusioncharts-container").should(
      "have.css",
      "font-family",
      '"Nunito Sans", sans-serif',
    );

    cy.UpdateChartType("Pie chart");
    cy.get("g[class$='item'] text").should(
      "have.css",
      "font-family",
      '"Nunito Sans"',
    );
    cy.get("g[class$='labels'] text").should(
      "have.css",
      "font-family",
      '"Nunito Sans"',
    );
    _.deployMode.DeployApp();
  });

  afterEach(() => {
    _.deployMode.NavigateBacktoEditor();
  });
});
