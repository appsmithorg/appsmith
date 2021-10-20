const dsl = require("../../../../fixtures/snipingModeDsl.json");
const snipableWidgets = require("../../../../locators/snipableWidgetsLocator.json");
const pages = require("../../../../locators/Pages.json");
const datasourceEditor = require("../../../../locators/DatasourcesEditor.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryEditor = require("../../../../locators/QueryEditor.json");

describe("Testing Sniping functionality", function() {
  before(() => {
    cy.addDsl(dsl);
    cy.NavigateToQueryEditor();
    cy.get(pages.integrationCreateNew)
      .should("be.visible")
      .click({ force: true });
    cy.get(pages.mockDatasourceUsers).click({ force: true });
    cy.get(`${datasourceEditor.datasourceCard} ${datasource.createQuerty}`)
      .last()
      .click({ force: true });
    cy.contains("Select").click({ force: true });
    cy.get(queryEditor.runQuery).click();
  });
  it("Audio Widget", function() {
    cy.SnipeWidget(snipableWidgets.audioWidget);
  });
  it("Audio Recorder Widget", function() {
    cy.SnipeWidget(snipableWidgets.audioRecorderWidget);
  });
  it("Button Widget", function() {
    cy.SnipeWidget(snipableWidgets.buttonWidget);
  });
  it("Chart Widget", function() {
    cy.SnipeWidget(snipableWidgets.chartWidget);
  });
  it("Checkbox Widget", function() {
    cy.SnipeWidget(snipableWidgets.checkboxWidget);
  });
  it("Checkbox Group Widget", function() {
    cy.SnipeWidget(snipableWidgets.checkboxGroupWidget);
  });
  it("Date Picker Widget", function() {
    cy.SnipeWidget(snipableWidgets.datepickerWidget2);
  });
  it("File Picker Widget", function() {
    cy.SnipeWidget(snipableWidgets.filepickerWidget);
  });

  // it("Form Button Widget", function() {
  //   cy.SnipeWidget(snipableWidgets.formButtonWidget);
  // });
  // it("Icon Button Widget", function() {
  //   cy.SnipeWidget(snipableWidgets.iconButtonWidget);
  // });
  it("Iframe Widget", function() {
    cy.SnipeWidget(snipableWidgets.iFrameWidget);
  });
  it("Image Widget", function() {
    cy.SnipeWidget(snipableWidgets.imageWidget);
  });
  it("Input Widget", function() {
    cy.SnipeWidget(snipableWidgets.inputWidget);
  });
  // it("List Widget", function() {
  //   cy.SnipeWidget(snipableWidgets.listWidget);
  // });
  it("Map Widget", function() {
    cy.SnipeWidget(snipableWidgets.mapWidget);
  });
  // it("Menu Button Widget", function() {
  //   cy.SnipeWidget(snipableWidgets.menuButtonWidget);
  // });
  it("Multi Select Tree Widget", function() {
    cy.SnipeWidget(snipableWidgets.multiselecttreeWidget);
  });
  it("Multi Select Widget", function() {
    cy.SnipeWidget(snipableWidgets.multiselectWidget);
  });
  it("Radio Widget", function() {
    cy.SnipeWidget(snipableWidgets.radioWidget);
  });
  it("Rate Widget", function() {
    cy.SnipeWidget(snipableWidgets.ratingWidget);
  });
  it("Rich Text Widget", function() {
    cy.SnipeWidget(snipableWidgets.richtexteditorWidget);
  });
  it("Dropdown Widget", function() {
    cy.SnipeWidget(snipableWidgets.dropdownWidget);
  });
  // it("Chart Widget", function() {
  //   cy.SnipeWidget(snipableWidgets.statboxWidget);
  // });
  it("Switch Widget", function() {
    cy.SnipeWidget(snipableWidgets.switchWidget);
  });
  it("Table Widget", function() {
    cy.SnipeWidget(snipableWidgets.tableWidget);
  });
  // it("Chart Widget", function() {
  //   cy.SnipeWidget(snipableWidgets.tabsWidget);
  // });
  // it("Text Widget", function() {
  //   cy.SnipeWidget(snipableWidgets.textWidget);
  // });
  it("Single Select Tree Widget", function() {
    cy.SnipeWidget(snipableWidgets.singleselecttreeWidget);
  });
  it("Video Widget", function() {
    cy.SnipeWidget(snipableWidgets.videoWidget);
  });
});
