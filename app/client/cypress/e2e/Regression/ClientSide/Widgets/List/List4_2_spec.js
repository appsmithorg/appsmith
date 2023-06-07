/// <reference types="Cypress" />

const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
const dsl = require("../../../../../fixtures/listdsl.json");
const publishPage = require("../../../../../locators/publishWidgetspage.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Container Widget Functionality", function () {
  const items = JSON.parse(dsl.dsl.children[0].listData);

  before(() => {
    cy.addDsl(dsl);
    cy.wait(5000);
  });

  it("1. ListWidget-Copy & Delete Verification", function () {
    //Copy Chart and verify all properties
    _.propPane.CopyWidgetFromPropertyPane("List1");
    _.propPane.DeleteWidgetFromPropertyPane("List1Copy");
    cy.PublishtheApp();
    // Verify the copied list widget is deleted
    cy.get(commonlocators.containerWidget).should("have.length", 2);
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("2. List widget background colour and deploy ", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");

    cy.moveToStyleTab();
    // Scroll down to Styles and Add background colour
    cy.selectColor("backgroundcolor");
    cy.wait(1000);
    cy.selectColor("itembackgroundcolor");
    // Click on Deploy and ensure it is deployed appropriately
    cy.PublishtheApp();
    // Ensure List Background Color
    cy.get(widgetsPage.listWidget).should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    );
    // Verify List Item Background Color
    cy.get(widgetsPage.itemContainerWidget).should(
      "have.css",
      "background-color",
      "rgb(126, 34, 206)",
    );
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("3. Toggle JS - List widget background colour and deploy ", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");

    cy.moveToStyleTab();
    // Scroll down to Styles and Add background colour
    cy.get(widgetsPage.backgroundColorToggleNew).click({ force: true });
    cy.testJsontext("backgroundcolor", "#FFC13D");
    cy.wait(1000);
    cy.get(widgetsPage.itemBackgroundColorToggle).click({ force: true });
    cy.testJsontext("itembackgroundcolor", "#38AFF4");
    // Click on Deploy and ensure it is deployed appropriately
    cy.PublishtheApp();
    // Ensure List Background Color
    cy.get(widgetsPage.listWidget).should(
      "have.css",
      "background-color",
      "rgb(255, 193, 61)",
    );
    // Verify List Item Background Color
    cy.get(widgetsPage.itemContainerWidget).should(
      "have.css",
      "background-color",
      "rgb(56, 175, 244)",
    );
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("4. Add new item in the list widget array object", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");

    //Add the new item in the list
    cy.testJsontext("items", JSON.stringify(this.data.ListItems));
    cy.wait(2000);
    cy.PublishtheApp();
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("5. Adding large item Spacing for item card", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");

    cy.moveToStyleTab();
    // Scroll down to Styles and Add item spacing for item card
    cy.testJsontext("itemspacing\\(" + "px" + "\\)", 12);
    cy.wait(2000);
    // Click on Deploy and ensure it is deployed appropriately
    cy.PublishtheApp();
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  it("6. Renaming the widget from Property pane and Entity explorer ", function () {
    // Open Property pane
    _.entityExplorer.SelectEntityByName("List1", "Widgets");

    // Change the list widget name from property pane and Verify it
    cy.widgetText(
      "List2",
      widgetsPage.listWidgetName,
      widgetsPage.widgetNameSpan,
    );
    // Change the list widget name from Entity Explorer
    cy.renameEntity("List2", "List1");
    // Mouse over to list name
    _.entityExplorer.SelectEntityByName("List1");

    cy.get(widgetsPage.listWidgetName)
      .first()
      .trigger("mouseover", { force: true });
    // Verify the list name is changed
    cy.contains(
      widgetsPage.listWidgetName + " " + commonlocators.listWidgetNameTag,
      "List1",
    );
    cy.PublishtheApp();
    cy.get(publishPage.backToEditor).click({ force: true });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
