const commonlocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/chartUpdatedDsl.json");
const pages = require("../../../../locators/Pages.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");
const widgetsPage = require("../../../../locators/Widgets.json");

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
      .type(this.data.ylabel);

    //Close edit prop
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
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

  it("Chart - Show Alert Modal", function() {
    //creating the Alert Modal and verify Modal name
    cy.createModal("Alert Modal", this.data.AlertModalName);
    cy.PublishtheApp();
    cy.get(widgetsPage.chartPlotGroup)
      .children()
      .first()
      .click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.AlertModalName,
    );
  });

  it("Chart - Form Modal Validation", function() {
    //creating the Form Modal and verify Modal name
    cy.updateModal("Form Modal", this.data.FormModalName);
    cy.PublishtheApp();
    cy.get(widgetsPage.chartPlotGroup)
      .children()
      .first()
      .click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.FormModalName,
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
    cy.EditWidgetPropertiesUsingJS(widgetsPage.inputToggleVisible, "false");
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("not.exist");
  });

  it("Toggle JS - Chart-Check Visible field Validation", function() {
    //Check the disabled checkbox using JS and Validate
    cy.EditWidgetPropertiesUsingJS(widgetsPage.inputToggleVisible, "true");
    cy.PublishtheApp();
    cy.get(publish.chartWidget).should("be.visible");
  });

  it("Chart Widget Functionality To Uncheck Horizontal Scroll Visible", function() {
    cy.togglebarDisable(commonlocators.horizontalScroll);
    cy.PublishtheApp();
    cy.get(publish.horizontalTab).should("not.exist");
  });

  it("Chart Widget Functionality To Check Horizontal Scroll Visible", function() {
    cy.togglebar(commonlocators.horizontalScroll);
    cy.PublishtheApp();
    cy.get(publish.horizontalTab)
      .eq(1)
      .should("exist");
  });

  it("Custom Chart Widget Functionality", function() {
    //changing the Chart type
    cy.get(widgetsPage.toggleChartType).click({ force: true });
    cy.UpdateChartType("Custom Chart");

    cy.testJsontext(
      "customfusionchartconfiguration",
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

    //Close edit prop
    cy.get(commonlocators.editPropCrossButton).click();
    cy.PublishtheApp();
  });

  it("Toggle JS - Custom Chart Widget Functionality", function() {
    //changing the Chart type
    cy.UpdateChartType("Pie Chart");
    cy.get(widgetsPage.toggleChartType).click({ force: true });
    cy.testJsontext("charttype", "CUSTOM_FUSION_CHART");

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
    cy.get(commonlocators.editPropCrossButton).click();
    cy.PublishtheApp();
  });

  it("Chart-Copy Verification", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //Copy Chart and verify all properties
    cy.copyWidget("chartwidget", viewWidgetsPage.chartWidget);

    cy.PublishtheApp();
  });

  it("Chart-Delete Verification", function() {
    // Delete the Chart widget
    cy.deleteWidget(viewWidgetsPage.chartWidget);
    cy.PublishtheApp();
    cy.get(viewWidgetsPage.chartWidget).should("not.exist");
  });

  afterEach(() => {
    cy.get(publish.backToEditor).click({ force: true });
  });
});
