const commonlocators = require("../../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/chartUpdatedDsl.json");
const modalWidgetPage = require("../../../../../locators/ModalWidget.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("Chart Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("chartwidget");
  });

  it("Fill the Chart Widget Properties.", function() {
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

  it("Pie Chart Widget Functionality", function() {
    //changing the Chart type
    cy.UpdateChartType("Pie Chart");

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
    cy.PublishtheApp();
  });

  it("Line Chart Widget Functionality", function() {
    //changing the Chart type
    cy.UpdateChartType("Line Chart");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    cy.PublishtheApp();
  });

  it("Bar Chart Widget Functionality", function() {
    //changing the Chart type
    cy.UpdateChartType("Bar Chart");

    //Verifying X-axis labels
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
    cy.PublishtheApp();
  });

  it("Area Chart Widget Functionality", function() {
    //changing the Chart type
    cy.UpdateChartType("Area Chart");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    cy.PublishtheApp();
  });

  it("Column Chart Widget Functionality", function() {
    //changing the Chart type
    cy.UpdateChartType("Column Chart");

    //Verifying X-axis labels
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
    cy.PublishtheApp();
  });

  it("Toggle JS - Pie Chart Widget Functionality", function() {
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
    cy.PublishtheApp();
  });

  it("Toggle JS - Line Chart Widget Functionality", function() {
    //changing the Chart type
    cy.testJsontext("charttype", "LINE_CHART");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    cy.PublishtheApp();
  });

  it("Toggle JS - Bar Chart Widget Functionality", function() {
    //changing the Chart type
    cy.testJsontext("charttype", "BAR_CHART");

    //Verifying X-axis labels
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
    cy.PublishtheApp();
  });

  it("Toggle JS - Area Chart Widget Functionality", function() {
    //changing the Chart type
    cy.testJsontext("charttype", "AREA_CHART");

    //Verifying X-axis labels
    cy.get(viewWidgetsPage.chartWidget).should("have.css", "opacity", "1");
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => {
      cy.get(viewWidgetsPage.rectangleChart)
        .last()
        .trigger("mousemove", { force: true });
      cy.get(viewWidgetsPage.Chartlabel)
        .eq(k)
        .should("have.text", labels[k]);
    });
    cy.PublishtheApp();
  });

  it("Toggle JS - Column Chart Widget Functionality", function() {
    //changing the Chart type
    cy.testJsontext("charttype", "COLUMN_CHART");

    //Verifying X-axis labels
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
    cy.PublishtheApp();
  });

  it("Chart - Modal", function() {
    //creating the Modal and verify Modal name
    cy.createModal(this.data.ModalName);
    cy.PublishtheApp();
    cy.get(widgetsPage.chartPlotGroup)
      .children()
      .first()
      .click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.ModalName,
    );
  });

  it("Chart-Unckeck Visible field Validation", function() {
    // Making the widget invisible
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("not.exist");
  });

  it("Chart-Check Visible field Validation", function() {
    // Making the widget visible
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("be.visible");
  });

  it("Toggle JS - Chart-Unckeck Visible field Validation", function() {
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "false");
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("not.exist");
  });

  it("Toggle JS - Chart-Check Visible field Validation", function() {
    //Check the disabled checkbox using JS and Validate
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("be.visible");
  });

  it("Chart Widget Functionality To Uncheck Horizontal Scroll Visible", function() {
    cy.togglebarDisable(commonlocators.allowScroll);
    cy.PublishtheApp();
    cy.get(publish.horizontalTab).should("not.exist");
  });

  it("Chart Widget Functionality To Check Horizontal Scroll Visible", function() {
    cy.togglebar(commonlocators.allowScroll);
    cy.PublishtheApp();
    cy.get(publish.horizontalTab)
      .eq(1)
      .should("exist");
  });

  it("Check Chart widget reskinning config", function() {
    cy.get(widgetsPage.toggleChartType).click({ force: true });
    cy.UpdateChartType("Column Chart");

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
      '"Nunito Sans"',
    );

    cy.UpdateChartType("Pie Chart");
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
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
