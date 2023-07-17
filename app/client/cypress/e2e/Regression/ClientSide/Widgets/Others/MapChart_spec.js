const commonLocators = require("../../../../../locators/commonlocators.json");
const viewWidgetsPage = require("../../../../../locators/ViewWidgets.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Map Chart Widget Functionality", function () {
  before(() => {
    _.agHelper.AddDsl("MapChartDsl");
  });

  beforeEach(() => {
    _.entityExplorer.SelectEntityByName("MapChart1", "Widgets");
  });

  afterEach(() => {
    _.deployMode.NavigateBacktoEditor();
  });

  it("1. Change Title", function () {
    cy.testJsontext("title", this.dataSet.chartIndata);
    cy.get(viewWidgetsPage.chartInnerText)
      .contains("App Sign Up")
      .should("have.text", "App Sign Up");
    _.deployMode.DeployApp();
  });

  it("2. Show Labels: FALSE", function () {
    cy.togglebarDisable(commonLocators.mapChartShowLabels);
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("not.exist");
    _.deployMode.DeployApp();
    // Show Labels: TRUE
    _.deployMode.NavigateBacktoEditor();
    _.entityExplorer.SelectEntityByName("MapChart1", "Widgets");
    cy.togglebar(commonLocators.mapChartShowLabels);
    cy.get(viewWidgetsPage.mapChartEntityLabels).eq(1).should("exist");
    _.deployMode.DeployApp();
  });

  it("3. Map type: World with Antarctica", function () {
    // Change the map type
    cy.updateMapType("World with Antarctica");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 7);
    _.deployMode.DeployApp();
  });

  it("4. Map type: World", function () {
    // Change the map type
    cy.updateMapType("World");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 6);
    _.deployMode.DeployApp();
  });

  it("5. Map type: Europe", function () {
    // Change the map type
    cy.updateMapType("Europe");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 47);
    _.deployMode.DeployApp();
  });

  it("6. Map type: North America", function () {
    // Change the map type
    cy.updateMapType("North America");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 26);
    _.deployMode.DeployApp();
  });

  it("7. Map type: South America", function () {
    // Change the map type
    cy.updateMapType("South America");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 16);
    _.deployMode.DeployApp();
  });

  it("8. Map type: Asia", function () {
    // Change the map type
    cy.updateMapType("Asia");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 49);
    _.deployMode.DeployApp();
  });

  it("9. Map type: Oceania", function () {
    // Change the map type
    cy.updateMapType("Oceania");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 15);
    _.deployMode.DeployApp();
  });

  it("10. Map type: Africa", function () {
    // Change the map type
    cy.updateMapType("Africa");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 56);
    _.deployMode.DeployApp();
  });

  it("11. Map type: USA", function () {
    // Change the map type
    cy.updateMapType("USA");
    // Verify the number of entities
    cy.get(viewWidgetsPage.mapChartEntityLabels).should("have.length", 51);
    _.deployMode.DeployApp();
  });

  it("12. Action: onDataPointClick, Open modal", function () {
    // Create the Alert Modal and verify Modal name
    cy.createModal(this.dataSet.ModalName, "onDataPointClick");
    _.deployMode.DeployApp();
    /*
    cy.get(widgetsPage.mapChartPlot)
      .children()
      .first()
      .click({ force: true });
    cy.get(modalWidgetPage.modelTextField).should(
      "have.text",
      this.dataSet.ModalName,
    );
    */
  });

  it("13. Action: onDataPointClick, Show message using selectedDataPoint", function () {
    cy.get(_.locators._jsToggle("ondatapointclick")).scrollIntoView().click();
    _.propPane.UpdatePropertyFieldValue("onDataPointClick", "");
    cy.get(_.locators._jsToggle("ondatapointclick")).click();

    const expectedEntityData = {
      value: 2.04,
      label: "South America",
      shortLabel: "SA",
      originalId: "SA",
      id: "sa",
    };
    // Set the map type to default
    cy.updateMapType("World");
    // Set action details for onDataPointClick
    const boundMessage = `{{JSON.stringify(MapChart1.selectedDataPoint)}}`;
    cy.addAction(boundMessage, "onDataPointClick");
    cy.get(commonLocators.chooseMsgType).last().click({ force: true });
    cy.get(commonLocators.chooseAction).children().contains("Success").click();
    // Click on the entity, South America
    cy.get(widgetsPage.mapChartPlot).children().first().click({ force: true });
    // Assert
    cy.validateToastMessage(JSON.stringify(expectedEntityData));
    _.deployMode.DeployApp();
  });
});
