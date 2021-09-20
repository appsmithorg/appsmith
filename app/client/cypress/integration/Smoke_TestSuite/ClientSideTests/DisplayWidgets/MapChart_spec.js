const commonLocators = require("../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../locators/ViewWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");
const dsl = require("../../../../fixtures/MapChartDsl.json");

describe("Map Chart Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("mapchartwidget");
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });

  it("Change Title", function() {
    cy.testCodeMirror(this.data.chartIndata);
    cy.get(viewWidgetsPage.chartInnerText)
      .contains("App Sign Up")
      .should("have.text", "App Sign Up");
    cy.PublishtheApp();
  });

  it("Show Labels: FALSE", function() {
    cy.togglebarDisable(commonLocators.mapChartShowLabels);
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("not.exist");
    cy.PublishtheApp();
  });

  it("Show Labels: TRUE", function() {
    cy.togglebar(commonLocators.mapChartShowLabels);
    cy.get(viewWidgetsPage.mapChartEntityLabels)
      .eq(1)
      .should("exist");
    cy.PublishtheApp();
  });

  it("Map type: World with Antarctica", function() {
    // Change the map type
    cy.updateMapType("World with Antarctica");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 7);
    cy.PublishtheApp();
  });

  it("Map type: World", function() {
    // Change the map type
    cy.updateMapType("World");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 6);
    cy.PublishtheApp();
  });

  it("Map type: Europe", function() {
    // Change the map type
    cy.updateMapType("Europe");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 47);
    cy.PublishtheApp();
  });

  it("Map type: North America", function() {
    // Change the map type
    cy.updateMapType("North America");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 26);
    cy.PublishtheApp();
  });

  it("Map type: South America", function() {
    // Change the map type
    cy.updateMapType("South America");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 16);
    cy.PublishtheApp();
  });

  it("Map type: Asia", function() {
    // Change the map type
    cy.updateMapType("Asia");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 49);
    cy.PublishtheApp();
  });

  it("Map type: Oceania", function() {
    // Change the map type
    cy.updateMapType("Oceania");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 15);
    cy.PublishtheApp();
  });

  it("Map type: Africa", function() {
    // Change the map type
    cy.updateMapType("Africa");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 56);
    cy.PublishtheApp();
  });

  it("Action: onEntityClick, Show Alert Modal", function() {
    // Create the Alert Modal and verify Modal name
    cy.createModal("Alert Modal", this.data.AlertModalName);
    cy.PublishtheApp();
    cy.get(widgetsPage.mapChartPlot)
      .children()
      .first()
      .click();
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.data.AlertModalName,
    );
  });
});
